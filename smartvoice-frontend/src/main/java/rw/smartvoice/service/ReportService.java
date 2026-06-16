package rw.smartvoice.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import rw.smartvoice.dto.AnalyticsResponse;
import rw.smartvoice.dto.DashboardReportResponse;
import rw.smartvoice.dto.PerformanceResponse;
import rw.smartvoice.dto.TrendPoint;
import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.FeedbackStatus;
import rw.smartvoice.model.FeedbackType;
import rw.smartvoice.model.Priority;
import rw.smartvoice.repository.FeedbackRepository;

import java.io.ByteArrayOutputStream;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final FeedbackRepository feedbackRepository;
    private final SystemSettingService systemSettingService;

    public ReportService(FeedbackRepository feedbackRepository,
                         SystemSettingService systemSettingService) {
        this.feedbackRepository = feedbackRepository;
        this.systemSettingService = systemSettingService;
    }

    public List<TrendPoint> trend(int days) {
        if (days <= 0) days = 30;

        Instant from = Instant.now().minus(days, ChronoUnit.DAYS);
        List<Object[]> rows = feedbackRepository.trendRaw(from);

        List<TrendPoint> out = new ArrayList<>();
        for (Object[] r : rows) {
            LocalDate date = toLocalDate(r[0]);
            long count = ((Number) r[1]).longValue();
            out.add(new TrendPoint(date, count));
        }
        return out;
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) return LocalDate.now();

        if (value instanceof java.sql.Date d) return d.toLocalDate();
        if (value instanceof LocalDate ld) return ld;
        if (value instanceof Timestamp ts) {
            return ts.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        if (value instanceof java.util.Date dt) {
            return dt.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        if (value instanceof Instant inst) {
            return inst.atZone(ZoneId.systemDefault()).toLocalDate();
        }

        return LocalDate.parse(value.toString());
    }

    public AnalyticsResponse analytics() {
        AnalyticsResponse r = new AnalyticsResponse();
        r.total = feedbackRepository.count();
        r.escalated = feedbackRepository.countByEscalatedTrue();
        r.health = "OK";

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (FeedbackStatus s : FeedbackStatus.values()) {
            byStatus.put(s.name(), feedbackRepository.countByStatus(s));
        }

        Map<String, Long> byType = new LinkedHashMap<>();
        for (FeedbackType t : FeedbackType.values()) {
            byType.put(t.name(), feedbackRepository.countByType(t));
        }

        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (Priority p : Priority.values()) {
            byPriority.put(p.name(), feedbackRepository.countByPriority(p));
        }

        Map<String, Long> bySentiment = new LinkedHashMap<>();
        bySentiment.put("POSITIVE", feedbackRepository.countByAiSentiment("POSITIVE"));
        bySentiment.put("NEUTRAL", feedbackRepository.countByAiSentiment("NEUTRAL"));
        bySentiment.put("NEGATIVE", feedbackRepository.countByAiSentiment("NEGATIVE"));

        r.byStatus = byStatus;
        r.byType = byType;
        r.byPriority = byPriority;
        r.bySentiment = bySentiment;

        return r;
    }

    public PerformanceResponse performance() {
        List<Feedback> all = feedbackRepository.findAllWithJoins();
        PerformanceResponse r = new PerformanceResponse();

        r.totalCases = all.size();

        long openCases = 0;
        long resolvedCases = 0;
        long escalatedCases = 0;
        long overdueCases = 0;

        double totalHandlingHours = 0;
        long handledCount = 0;

        Map<String, PerformanceResponse.DepartmentPerformanceRow> departmentMap = new LinkedHashMap<>();
        Map<String, PerformanceResponse.StaffPerformanceRow> staffMap = new LinkedHashMap<>();

        Instant now = Instant.now();
        int overdueHoursLimit = systemSettingService.getIntValue("escalation_overdue_hours", 48);

        for (Feedback f : all) {
            boolean resolvedLike =
                    f.getStatus() == FeedbackStatus.RESOLVED ||
                    f.getStatus() == FeedbackStatus.CLOSED;

            boolean openLike =
                    f.getStatus() == FeedbackStatus.NEW ||
                    f.getStatus() == FeedbackStatus.ASSIGNED ||
                    f.getStatus() == FeedbackStatus.IN_PROGRESS;

            if (openLike) openCases++;
            if (resolvedLike) resolvedCases++;
            if (f.isEscalated()) escalatedCases++;

            if (openLike && f.getCreatedAt() != null) {
                long ageHours = Duration.between(f.getCreatedAt(), now).toHours();
                if (ageHours > overdueHoursLimit) {
                    overdueCases++;
                }
            }

            if (resolvedLike && f.getCreatedAt() != null && f.getUpdatedAt() != null) {
                long hours = Math.max(0, Duration.between(f.getCreatedAt(), f.getUpdatedAt()).toHours());
                totalHandlingHours += hours;
                handledCount++;
            }

            String depName = f.getAssignedDepartment() != null
                    ? f.getAssignedDepartment().getName()
                    : "Unassigned";

            PerformanceResponse.DepartmentPerformanceRow depRow =
                    departmentMap.computeIfAbsent(depName, k -> {
                        PerformanceResponse.DepartmentPerformanceRow x =
                                new PerformanceResponse.DepartmentPerformanceRow();
                        x.departmentName = k;
                        return x;
                    });

            depRow.totalCases++;
            if (resolvedLike) depRow.resolvedCases++;
            if (f.isEscalated()) depRow.escalatedCases++;

            if (f.getAssignedStaff() != null) {
                String staffKey = f.getAssignedStaff().getEmail();

                PerformanceResponse.StaffPerformanceRow staffRow =
                        staffMap.computeIfAbsent(staffKey, k -> {
                            PerformanceResponse.StaffPerformanceRow x =
                                    new PerformanceResponse.StaffPerformanceRow();
                            x.staffName = f.getAssignedStaff().getFullName();
                            x.staffEmail = f.getAssignedStaff().getEmail();
                            return x;
                        });

                staffRow.assignedCases++;

                if (resolvedLike) staffRow.resolvedCases++;
                if (f.getStatus() == FeedbackStatus.IN_PROGRESS) {
                    staffRow.inProgressCases++;
                }
            }
        }

        r.openCases = openCases;
        r.resolvedCases = resolvedCases;
        r.escalatedCases = escalatedCases;
        r.overdueCases = overdueCases;

        r.resolutionRate = r.totalCases == 0
                ? 0
                : round2((resolvedCases * 100.0) / r.totalCases);

        r.averageHandlingHours = handledCount == 0
                ? 0
                : round2(totalHandlingHours / handledCount);

        for (PerformanceResponse.DepartmentPerformanceRow row : departmentMap.values()) {
            row.resolutionRate = row.totalCases == 0
                    ? 0
                    : round2((row.resolvedCases * 100.0) / row.totalCases);

            row.benchmark = benchmarkDepartment(row);
        }

        for (PerformanceResponse.StaffPerformanceRow row : staffMap.values()) {
            row.resolutionRate = row.assignedCases == 0
                    ? 0
                    : round2((row.resolvedCases * 100.0) / row.assignedCases);

            row.benchmark = benchmarkStaff(row);
        }

        r.departments = departmentMap.values().stream()
                .sorted((a, b) -> Double.compare(b.resolutionRate, a.resolutionRate))
                .toList();

        r.staff = staffMap.values().stream()
                .sorted((a, b) -> Double.compare(b.resolutionRate, a.resolutionRate))
                .toList();

        r.topDepartments = r.departments.stream().limit(3).toList();

        r.topStaff = r.staff.stream()
                .sorted((a, b) -> {
                    int byResolved = Long.compare(b.resolvedCases, a.resolvedCases);
                    if (byResolved != 0) return byResolved;
                    return Double.compare(b.resolutionRate, a.resolutionRate);
                })
                .limit(3)
                .toList();

        if (r.overdueCases > 0) {
            r.recommendations.add("Some cases are overdue. Increase follow-up on unresolved complaints.");
        }

        for (PerformanceResponse.DepartmentPerformanceRow row : r.departments) {
            if (row.totalCases >= 3 && row.resolutionRate < 50) {
                r.recommendations.add(row.departmentName + " department needs attention due to a low resolution rate.");
            }
            if (row.escalatedCases >= 3) {
                r.recommendations.add(row.departmentName + " department has many escalated cases and may need faster handling.");
            }
        }

        if (!r.topStaff.isEmpty()) {
            PerformanceResponse.StaffPerformanceRow best = r.topStaff.get(0);
            r.recommendations.add("Top staff performer currently is " + best.staffName + " with " + best.resolvedCases + " resolved cases.");
        }

        if (r.recommendations.isEmpty()) {
            r.recommendations.add("Overall performance is stable. Continue monitoring resolution speed and customer satisfaction.");
        }

        return r;
    }

    private String benchmarkDepartment(PerformanceResponse.DepartmentPerformanceRow row) {
        if (row.totalCases == 0) return "No Data";

        if (row.resolutionRate >= 80 && row.escalatedCases <= 1) {
            return "Excellent";
        }
        if (row.resolutionRate >= 50) {
            return "Good";
        }
        return "Needs Attention";
    }

    private String benchmarkStaff(PerformanceResponse.StaffPerformanceRow row) {
        if (row.assignedCases == 0) return "No Data";

        if (row.resolutionRate >= 80 && row.resolvedCases >= 3) {
            return "Excellent";
        }
        if (row.resolutionRate >= 50) {
            return "Good";
        }
        return "Needs Attention";
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public DashboardReportResponse dashboardReport(long unreadNotifications) {
        AnalyticsResponse analytics = analytics();
        PerformanceResponse performance = performance();
        List<TrendPoint> trend = trend(14);

        DashboardReportResponse d = new DashboardReportResponse();
        d.unreadNotifications = unreadNotifications;

        d.totalFeedback = analytics.total;
        d.escalated = analytics.escalated;
        d.urgent = analytics.byPriority != null
                ? analytics.byPriority.getOrDefault("URGENT", 0L)
                : 0L;

        d.openCases = performance.openCases;
        d.resolvedCases = performance.resolvedCases;
        d.overdueCases = performance.overdueCases;
        d.resolutionRate = performance.resolutionRate;
        d.averageHandlingHours = performance.averageHandlingHours;

        d.byStatus = analytics.byStatus;
        d.trend = trend;

        return d;
    }

    public byte[] exportAnalyticsPdf() {
        AnalyticsResponse a = analytics();
        PerformanceResponse p = performance();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
            Font sectionFont = new Font(Font.HELVETICA, 12, Font.BOLD);

            doc.add(new Paragraph("SmartVoice - Analytics Report", titleFont));
            doc.add(new Paragraph("Generated: " + Instant.now()));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("Total Feedback: " + a.total));
            doc.add(new Paragraph("Escalated: " + a.escalated));
            doc.add(new Paragraph("Health: " + a.health));
            doc.add(new Paragraph("Resolution Rate: " + p.resolutionRate + "%"));
            doc.add(new Paragraph("Average Handling Hours: " + p.averageHandlingHours));
            doc.add(new Paragraph("Overdue Cases: " + p.overdueCases));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("By Status", sectionFont));
            doc.add(tableFromMap(a.byStatus));

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("By Type", sectionFont));
            doc.add(tableFromMap(a.byType));

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("By Priority", sectionFont));
            doc.add(tableFromMap(a.byPriority));

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph("By Sentiment", sectionFont));
            doc.add(tableFromMap(a.bySentiment));

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to generate PDF: " + e.getMessage());
        }
    }

    private PdfPTable tableFromMap(Map<String, Long> map) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.addCell("Name");
        table.addCell("Count");

        for (var entry : map.entrySet()) {
            table.addCell(entry.getKey());
            table.addCell(String.valueOf(entry.getValue()));
        }

        return table;
    }
}