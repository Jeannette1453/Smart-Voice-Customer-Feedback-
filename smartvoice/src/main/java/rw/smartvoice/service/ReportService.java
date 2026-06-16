package rw.smartvoice.service;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import rw.smartvoice.dto.AnalyticsResponse;
import rw.smartvoice.dto.TrendPoint;
import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.FeedbackStatus;
import rw.smartvoice.model.FeedbackType;
import rw.smartvoice.model.Priority;
import rw.smartvoice.repository.FeedbackRatingRepository;
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
import java.util.UUID;

@Service
public class ReportService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackRatingRepository feedbackRatingRepository;

    public ReportService(FeedbackRepository feedbackRepository,
                         FeedbackRatingRepository feedbackRatingRepository) {
        this.feedbackRepository = feedbackRepository;
        this.feedbackRatingRepository = feedbackRatingRepository;
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
        if (value instanceof Timestamp ts) return ts.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        if (value instanceof java.util.Date dt) return dt.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        if (value instanceof Instant inst) return inst.atZone(ZoneId.systemDefault()).toLocalDate();
        return LocalDate.parse(value.toString());
    }

    public long countOverdueCases() {
        Instant limit = Instant.now().minus(48, ChronoUnit.HOURS);
        return feedbackRepository.countByStatusInAndCreatedAtBefore(
                List.of(FeedbackStatus.NEW, FeedbackStatus.ASSIGNED, FeedbackStatus.IN_PROGRESS), limit);
    }

    public double averageHandlingHours() {
        List<Feedback> resolved = feedbackRepository.findByStatusIn(
                List.of(FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED));
        if (resolved.isEmpty()) return 0.0;
        double totalHours = 0.0;
        int count = 0;
        for (Feedback f : resolved) {
            if (f.getCreatedAt() != null && f.getUpdatedAt() != null) {
                totalHours += Duration.between(f.getCreatedAt(), f.getUpdatedAt()).toHours();
                count++;
            }
        }
        return count == 0 ? 0.0 : Math.round((totalHours / count) * 10.0) / 10.0;
    }

    // ── Analytics for a specific user (customer) ──────────────────────────────
    public AnalyticsResponse analyticsForUser(UUID userId) {
        AnalyticsResponse r = new AnalyticsResponse();
        r.total = feedbackRepository.countByCustomer_Id(userId);
        r.escalated = feedbackRepository.countByEscalatedTrueAndCustomer_Id(userId);

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (FeedbackStatus s : FeedbackStatus.values())
            byStatus.put(s.name(), feedbackRepository.countByStatusAndCustomer_Id(s, userId));

        Map<String, Long> byType = new LinkedHashMap<>();
        for (FeedbackType t : FeedbackType.values())
            byType.put(t.name(), feedbackRepository.countByTypeAndCustomer_Id(t, userId));

        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (Priority p : Priority.values())
            byPriority.put(p.name(), feedbackRepository.countByPriorityAndCustomer_Id(p, userId));

        Map<String, Long> bySentiment = new LinkedHashMap<>();
        for (Object[] row : feedbackRepository.countBySentimentByCustomer(userId))
            bySentiment.put(String.valueOf(row[0]), ((Number) row[1]).longValue());

        Map<String, Long> byDepartment = new LinkedHashMap<>();
        for (Object[] row : feedbackRepository.countByDepartmentByCustomer(userId))
            byDepartment.put(String.valueOf(row[0]), ((Number) row[1]).longValue());

        Map<String, Long> topCategories = new LinkedHashMap<>();
        List<Object[]> catRows = feedbackRepository.topCategoriesByCustomer(userId);
        for (int i = 0; i < Math.min(catRows.size(), 5); i++)
            topCategories.put(String.valueOf(catRows.get(i)[0]), ((Number) catRows.get(i)[1]).longValue());

        r.byStatus = byStatus; r.byType = byType; r.byPriority = byPriority;
        r.bySentiment = bySentiment; r.byDepartment = byDepartment; r.topCategories = topCategories;
        r.openCases = byStatus.getOrDefault("NEW", 0L) + byStatus.getOrDefault("ASSIGNED", 0L) + byStatus.getOrDefault("IN_PROGRESS", 0L);
        r.resolvedCases = byStatus.getOrDefault("RESOLVED", 0L) + byStatus.getOrDefault("CLOSED", 0L);
        r.resolutionRate = r.total == 0 ? 0.0 : Math.round(((double) r.resolvedCases / r.total) * 1000.0) / 10.0;
        return r;
    }

    // ── Full analytics (no filter) ────────────────────────────────────────────
    public AnalyticsResponse analytics() {
        return analyticsBetween(null, null);
    }

    // ── Analytics with optional date range ───────────────────────────────────
    public AnalyticsResponse analyticsBetween(Instant from, Instant to) {
        boolean filtered = from != null && to != null;
        AnalyticsResponse r = new AnalyticsResponse();

        r.total = filtered ? feedbackRepository.countByCreatedAtBetween(from, to) : feedbackRepository.count();
        r.escalated = filtered ? feedbackRepository.countByEscalatedTrueAndCreatedAtBetween(from, to) : feedbackRepository.countByEscalatedTrue();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (FeedbackStatus s : FeedbackStatus.values())
            byStatus.put(s.name(), filtered ? feedbackRepository.countByStatusAndCreatedAtBetween(s, from, to) : feedbackRepository.countByStatus(s));

        Map<String, Long> byType = new LinkedHashMap<>();
        for (FeedbackType t : FeedbackType.values())
            byType.put(t.name(), filtered ? feedbackRepository.countByTypeAndCreatedAtBetween(t, from, to) : feedbackRepository.countByType(t));

        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (Priority p : Priority.values())
            byPriority.put(p.name(), filtered ? feedbackRepository.countByPriorityAndCreatedAtBetween(p, from, to) : feedbackRepository.countByPriority(p));

        Map<String, Long> bySentiment = new LinkedHashMap<>();
        List<Object[]> sentRows = filtered ? feedbackRepository.countBySentimentRawBetween(from, to) : feedbackRepository.countBySentimentRaw();
        for (Object[] row : sentRows)
            bySentiment.put(String.valueOf(row[0]), ((Number) row[1]).longValue());

        Map<String, Long> byDepartment = new LinkedHashMap<>();
        List<Object[]> deptRows = filtered ? feedbackRepository.countByDepartmentRawBetween(from, to) : feedbackRepository.countByDepartmentRaw();
        for (Object[] row : deptRows)
            byDepartment.put(String.valueOf(row[0]), ((Number) row[1]).longValue());

        Map<String, Long> topCategories = new LinkedHashMap<>();
        List<Object[]> catRows = filtered ? feedbackRepository.topCategoriesRawBetween(from, to) : feedbackRepository.topCategoriesRaw();
        for (int i = 0; i < Math.min(catRows.size(), 5); i++)
            topCategories.put(String.valueOf(catRows.get(i)[0]), ((Number) catRows.get(i)[1]).longValue());

        Double avg = feedbackRatingRepository.averageRatingValue();
        r.averageRating = avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0;
        r.byStatus = byStatus; r.byType = byType; r.byPriority = byPriority;
        r.bySentiment = bySentiment; r.byDepartment = byDepartment; r.topCategories = topCategories;
        r.overdueCases = countOverdueCases();
        r.averageHandlingHours = averageHandlingHours();
        r.openCases = byStatus.getOrDefault("NEW", 0L) + byStatus.getOrDefault("ASSIGNED", 0L) + byStatus.getOrDefault("IN_PROGRESS", 0L);
        r.resolvedCases = byStatus.getOrDefault("RESOLVED", 0L) + byStatus.getOrDefault("CLOSED", 0L);
        r.urgentCases = byPriority.getOrDefault("URGENT", 0L);
        r.resolutionRate = r.total == 0 ? 0.0 : Math.round(((double) r.resolvedCases / r.total) * 1000.0) / 10.0;
        return r;
    }

    // ── PDF Export ────────────────────────────────────────────────────────────
    public byte[] exportAnalyticsPdf(String generatedBy) {
        return exportAnalyticsPdf(generatedBy, null, null, "all", null, null, null);
    }

    public byte[] exportAnalyticsPdf(String generatedBy, Instant from, Instant to,
                                      String reportType, String dateRange,
                                      UUID userId, String userLabel) {
        AnalyticsResponse a;
        if (userId != null) a = analyticsForUser(userId);
        else if (from != null && to != null) a = analyticsBetween(from, to);
        else a = analytics();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate(), 30, 30, 40, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font blue  = new Font(Font.HELVETICA, 13, Font.NORMAL, new java.awt.Color(37, 99, 168));
            Font red   = new Font(Font.HELVETICA, 18, Font.NORMAL, new java.awt.Color(232, 25, 44));
            Font title = new Font(Font.HELVETICA, 14, Font.BOLD,   new java.awt.Color(15, 23, 42));
            Font meta  = new Font(Font.HELVETICA, 9,  Font.NORMAL, new java.awt.Color(100, 116, 139));
            Font secHdr= new Font(Font.HELVETICA, 10, Font.BOLD,   new java.awt.Color(15, 23, 42));
            Font hdr   = new Font(Font.HELVETICA, 9,  Font.BOLD,   java.awt.Color.WHITE);
            Font cell  = new Font(Font.HELVETICA, 8,  Font.NORMAL, new java.awt.Color(15, 23, 42));
            Font numF  = new Font(Font.HELVETICA, 8,  Font.NORMAL, new java.awt.Color(150, 150, 150));
            Font totF  = new Font(Font.HELVETICA, 9,  Font.BOLD,   new java.awt.Color(37, 99, 168));

            // ── Header: logo | company+title | period ──
            PdfPTable headerTable = new PdfPTable(3);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{2f, 3f, 2f});

            // Logo
            int hW=350, hH=70;
            java.awt.image.BufferedImage logoImg = new java.awt.image.BufferedImage(hW, hH, java.awt.image.BufferedImage.TYPE_INT_ARGB);
            java.awt.Graphics2D g = logoImg.createGraphics();
            g.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING, java.awt.RenderingHints.VALUE_ANTIALIAS_ON);
            g.setComposite(java.awt.AlphaComposite.Clear); g.fillRect(0,0,hW,hH);
            g.setComposite(java.awt.AlphaComposite.SrcOver);
            g.setColor(new java.awt.Color(232,25,44)); g.fillRect(0,5,50,42);
            g.setColor(new java.awt.Color(37,99,168)); g.fillRect(8,13,50,42);
            g.setColor(java.awt.Color.WHITE);
            g.setFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 14));
            java.awt.FontMetrics fm = g.getFontMetrics();
            g.drawString("LOLC", 8+(50-fm.stringWidth("LOLC"))/2, 13+(42+fm.getAscent()-fm.getDescent())/2);
            int tx=68;
            g.setColor(new java.awt.Color(37,99,168));
            g.setFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 14));
            g.drawString("LOLC", tx, 28);
            g.setColor(new java.awt.Color(232,25,44));
            g.setFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 18));
            g.drawString("UNGUKA FINANCE", tx, 50);
            g.dispose();
            ByteArrayOutputStream logoOut = new ByteArrayOutputStream();
            javax.imageio.ImageIO.write(logoImg, "PNG", logoOut);
            com.lowagie.text.Image logoImage = com.lowagie.text.Image.getInstance(logoOut.toByteArray());
            logoImage.scaleToFit(160, 60);
            com.lowagie.text.pdf.PdfPCell logoCell = new com.lowagie.text.pdf.PdfPCell(logoImage, false);
            logoCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
            headerTable.addCell(logoCell);

            // Center
            com.lowagie.text.pdf.PdfPCell centerCell = new com.lowagie.text.pdf.PdfPCell();
            centerCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            centerCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            centerCell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
            Paragraph cn = new Paragraph("LOLC UNGUKA FINANCE", new Font(Font.HELVETICA, 14, Font.BOLD, new java.awt.Color(37,99,168)));
            cn.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            String rLabel = (reportType != null && !reportType.equals("all")) ? "Analytics Report — " + reportType : "Analytics Report";
            Paragraph rt = new Paragraph(rLabel, title);
            rt.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            centerCell.addElement(cn); centerCell.addElement(rt);
            headerTable.addCell(centerCell);

            // Period
            com.lowagie.text.pdf.PdfPCell periodCell = new com.lowagie.text.pdf.PdfPCell();
            periodCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            periodCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
            periodCell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
            Paragraph pl = new Paragraph("REPORT PERIOD", meta); pl.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
            periodCell.addElement(pl);
            if (dateRange != null) {
                String[] parts = dateRange.split(" to ");
                if (parts.length == 2) {
                    Paragraph p1 = new Paragraph(parts[0], new Font(Font.HELVETICA,10,Font.BOLD,new java.awt.Color(15,23,42))); p1.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
                    Paragraph dash = new Paragraph("—", meta); dash.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
                    Paragraph p2 = new Paragraph(parts[1], new Font(Font.HELVETICA,10,Font.BOLD,new java.awt.Color(15,23,42))); p2.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
                    periodCell.addElement(p1); periodCell.addElement(dash); periodCell.addElement(p2);
                }
            } else {
                Paragraph at = new Paragraph("All Time", new Font(Font.HELVETICA,10,Font.BOLD,new java.awt.Color(15,23,42))); at.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
                periodCell.addElement(at);
            }
            if (userLabel != null) { Paragraph ul = new Paragraph("User: " + userLabel, meta); ul.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT); periodCell.addElement(ul); }
            headerTable.addCell(periodCell);
            doc.add(headerTable);

            // Divider
            PdfPTable div = new PdfPTable(1); div.setWidthPercentage(100); div.setSpacingBefore(6f);
            com.lowagie.text.pdf.PdfPCell dc = new com.lowagie.text.pdf.PdfPCell();
            dc.setBackgroundColor(new java.awt.Color(37,99,168)); dc.setFixedHeight(2f); dc.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            div.addCell(dc); doc.add(div);
            doc.add(new Paragraph(" "));

            // Section title
            doc.add(new Paragraph("1. ANALYTICS SUMMARY", secHdr));
            doc.add(new Paragraph(" "));

            // One combined analytics table: # | Category | Name | Count
            boolean all = reportType == null || reportType.equals("all");
            java.util.LinkedHashMap<String, Map<String, Long>> sections = new java.util.LinkedHashMap<>();
            if (all || reportType.equals("byStatus"))      sections.put("By Status",     a.byStatus);
            if (all || reportType.equals("byType"))        sections.put("By Type",        a.byType);
            if (all || reportType.equals("byPriority"))    sections.put("By Priority",    a.byPriority);
            if (all || reportType.equals("bySentiment"))   sections.put("By Sentiment",   a.bySentiment);
            if (all || reportType.equals("byDepartment"))  sections.put("By Department",  a.byDepartment);
            if (all || reportType.equals("topCategories")) sections.put("Top Categories", a.topCategories);

            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.5f, 2.5f, 3f, 1.5f});

            for (String h : new String[]{"#","Category","Name","Count"}) {
                com.lowagie.text.pdf.PdfPCell hc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(h, hdr));
                hc.setBackgroundColor(new java.awt.Color(37,99,168)); hc.setPadding(6);
                hc.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                hc.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                table.addCell(hc);
            }

            int rowNum = 1;
            for (var section : sections.entrySet()) {
                for (var entry : section.getValue().entrySet()) {
                    boolean alt = rowNum % 2 == 0;
                    java.awt.Color bg = alt ? new java.awt.Color(241,245,249) : java.awt.Color.WHITE;
                    com.lowagie.text.pdf.PdfPCell nc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(String.valueOf(rowNum++), numF));
                    nc.setBackgroundColor(bg); nc.setPadding(5); nc.setBorderColor(new java.awt.Color(226,232,240));
                    com.lowagie.text.pdf.PdfPCell cc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(section.getKey(), new Font(Font.HELVETICA,8,Font.BOLD,new java.awt.Color(37,99,168))));
                    cc.setBackgroundColor(bg); cc.setPadding(5); cc.setBorderColor(new java.awt.Color(226,232,240));
                    com.lowagie.text.pdf.PdfPCell c1 = new com.lowagie.text.pdf.PdfPCell(new Paragraph(entry.getKey(), cell));
                    c1.setBackgroundColor(bg); c1.setPadding(5); c1.setBorderColor(new java.awt.Color(226,232,240));
                    com.lowagie.text.pdf.PdfPCell c2 = new com.lowagie.text.pdf.PdfPCell(new Paragraph(String.valueOf(entry.getValue()), cell));
                    c2.setBackgroundColor(bg); c2.setPadding(5); c2.setBorderColor(new java.awt.Color(226,232,240));
                    table.addCell(nc); table.addCell(cc); table.addCell(c1); table.addCell(c2);
                }
            }

            // Total row
            com.lowagie.text.pdf.PdfPCell tl = new com.lowagie.text.pdf.PdfPCell(new Paragraph("Total Feedback", totF));
            tl.setColspan(2); tl.setBackgroundColor(new java.awt.Color(235,245,255)); tl.setPadding(6); tl.setBorderColor(new java.awt.Color(226,232,240));
            table.addCell(tl);
            com.lowagie.text.pdf.PdfPCell tv = new com.lowagie.text.pdf.PdfPCell(new Paragraph(String.valueOf(a.total), totF));
            tv.setColspan(2); tv.setBackgroundColor(new java.awt.Color(235,245,255)); tv.setPadding(6); tv.setBorderColor(new java.awt.Color(226,232,240));
            table.addCell(tv);
            doc.add(table);

            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(" "));

            // Signature section
            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(80);
            sigTable.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            sigTable.setWidths(new float[]{1f, 1f});
            sigTable.setSpacingBefore(20f);
            for (String[] sig : new String[][]{{"PREPARED BY","Administrator"},{"APPROVED BY","Manager"}}) {
                com.lowagie.text.pdf.PdfPCell sc = new com.lowagie.text.pdf.PdfPCell();
                sc.setBorder(com.lowagie.text.Rectangle.BOX); sc.setPadding(14); sc.setBorderColor(new java.awt.Color(200,200,200));
                Paragraph st = new Paragraph(sig[0], new Font(Font.HELVETICA,9,Font.BOLD,new java.awt.Color(37,99,168))); st.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                sc.addElement(st);
                sc.addElement(new Paragraph(" ")); sc.addElement(new Paragraph(" "));
                sc.addElement(new Paragraph("_______________________________", meta));
                Paragraph sl = new Paragraph("Signature", meta); sl.setAlignment(com.lowagie.text.Element.ALIGN_CENTER); sc.addElement(sl);
                Paragraph sn = new Paragraph(sig[1], new Font(Font.HELVETICA,9,Font.BOLD,new java.awt.Color(15,23,42))); sn.setAlignment(com.lowagie.text.Element.ALIGN_CENTER); sc.addElement(sn);
                sc.addElement(new Paragraph(" "));
                sc.addElement(new Paragraph("Date: _______________________", meta));
                sigTable.addCell(sc);
            }
            doc.add(sigTable);

            // Footer
            doc.add(new Paragraph(" "));
            PdfPTable footer = new PdfPTable(1); footer.setWidthPercentage(100);
            com.lowagie.text.pdf.PdfPCell fc = new com.lowagie.text.pdf.PdfPCell(
                new Paragraph("Generated on: " + java.time.ZonedDateTime.now(ZoneId.of("Africa/Kigali"))
                    .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"))
                    + "  |  Generated by: " + generatedBy
                    + "  |  © " + java.time.Year.now().getValue() + " LOLC Unguka Finance. Confidential.", meta));
            fc.setBorder(com.lowagie.text.Rectangle.TOP); fc.setPaddingTop(6);
            fc.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            footer.addCell(fc);
            doc.add(footer);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to generate PDF: " + e.getMessage());
        }
    }

    // ── Detailed Feedback PDF (one table, like the sample) ───────────────────
    public byte[] exportDetailedPdf(String generatedBy, Instant from, Instant to,
                                     UUID userId, String dateRange) {
        return exportDetailedPdf(generatedBy, from, to, userId, dateRange, null, null, null);
    }

    public byte[] exportDetailedPdf(String generatedBy, Instant from, Instant to,
                                     UUID userId, String dateRange,
                                     String filterType, String filterSentiment, String filterDepartment) {
        // Fetch base list then filter in Java (avoids JPQL nullable param issues)
        List<rw.smartvoice.model.Feedback> all;
        if (userId != null && from != null && to != null) {
            all = feedbackRepository.findForReportByCustomerAndDate(userId, from, to);
        } else if (userId != null) {
            all = feedbackRepository.findForReportByCustomer(userId);
        } else if (from != null && to != null) {
            all = feedbackRepository.findForReportByDate(from, to);
        } else {
            all = feedbackRepository.findAllForReport();
        }

        // Apply additional filters in memory
        List<rw.smartvoice.model.Feedback> feedbacks = all.stream()
            .filter(f -> {
                if (filterType != null && !filterType.isBlank()) {
                    try {
                        // Try as FeedbackType
                        rw.smartvoice.model.FeedbackType t = rw.smartvoice.model.FeedbackType.valueOf(filterType.toUpperCase());
                        if (f.getType() != t) return false;
                    } catch (Exception e1) {
                        try {
                            // Try as FeedbackStatus
                            rw.smartvoice.model.FeedbackStatus s = rw.smartvoice.model.FeedbackStatus.valueOf(filterType.toUpperCase());
                            if (f.getStatus() != s) return false;
                        } catch (Exception e2) {
                            try {
                                // Try as Priority
                                rw.smartvoice.model.Priority p = rw.smartvoice.model.Priority.valueOf(filterType.toUpperCase());
                                if (f.getPriority() != p) return false;
                            } catch (Exception ignored) {}
                        }
                    }
                }
                if (filterSentiment != null && !filterSentiment.isBlank()) {
                    if (!filterSentiment.equalsIgnoreCase(f.getAiSentiment())) return false;
                }
                if (filterDepartment != null && !filterDepartment.isBlank()) {
                    String deptName = f.getAssignedDepartment() != null ? f.getAssignedDepartment().getName() : "";
                    if (!filterDepartment.equalsIgnoreCase(deptName)) return false;
                }
                return true;
            })
            .toList();
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4.rotate(), 30, 30, 40, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font blue   = new Font(Font.HELVETICA, 13, Font.NORMAL, new java.awt.Color(37, 99, 168));
            Font red    = new Font(Font.HELVETICA, 18, Font.NORMAL, new java.awt.Color(232, 25, 44));
            Font title  = new Font(Font.HELVETICA, 14, Font.BOLD,   new java.awt.Color(15, 23, 42));
            Font meta   = new Font(Font.HELVETICA, 9,  Font.NORMAL, new java.awt.Color(100, 116, 139));
            Font secHdr = new Font(Font.HELVETICA, 10, Font.BOLD,   new java.awt.Color(15, 23, 42));
            Font hdr    = new Font(Font.HELVETICA, 9,  Font.BOLD,   java.awt.Color.WHITE);
            Font cell   = new Font(Font.HELVETICA, 8,  Font.NORMAL, new java.awt.Color(15, 23, 42));
            Font num    = new Font(Font.HELVETICA, 8,  Font.NORMAL, new java.awt.Color(150, 150, 150));
            Font total  = new Font(Font.HELVETICA, 9,  Font.BOLD,   new java.awt.Color(37, 99, 168));

            // ── Header: logo left, company center, period right ──
            PdfPTable headerTable = new PdfPTable(3);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{2f, 3f, 2f});

            // Logo cell
            int hW=350, hH=70;
            java.awt.image.BufferedImage logoImg = new java.awt.image.BufferedImage(hW, hH, java.awt.image.BufferedImage.TYPE_INT_ARGB);
            java.awt.Graphics2D g = logoImg.createGraphics();
            g.setRenderingHint(java.awt.RenderingHints.KEY_ANTIALIASING, java.awt.RenderingHints.VALUE_ANTIALIAS_ON);
            g.setComposite(java.awt.AlphaComposite.Clear); g.fillRect(0,0,hW,hH);
            g.setComposite(java.awt.AlphaComposite.SrcOver);
            g.setColor(new java.awt.Color(232,25,44)); g.fillRect(0,5,50,42);
            g.setColor(new java.awt.Color(37,99,168)); g.fillRect(8,13,50,42);
            g.setColor(java.awt.Color.WHITE);
            g.setFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 14));
            java.awt.FontMetrics fm = g.getFontMetrics();
            g.drawString("LOLC", 8+(50-fm.stringWidth("LOLC"))/2, 13+(42+fm.getAscent()-fm.getDescent())/2);
            int tx=68;
            g.setColor(new java.awt.Color(37,99,168));
            g.setFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 14));
            g.drawString("LOLC", tx, 28);
            g.setColor(new java.awt.Color(232,25,44));
            g.setFont(new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 18));
            g.drawString("UNGUKA FINANCE", tx, 50);
            g.dispose();
            ByteArrayOutputStream logoOut = new ByteArrayOutputStream();
            javax.imageio.ImageIO.write(logoImg, "PNG", logoOut);
            com.lowagie.text.Image logoImage = com.lowagie.text.Image.getInstance(logoOut.toByteArray());
            logoImage.scaleToFit(160, 60);
            com.lowagie.text.pdf.PdfPCell logoCell = new com.lowagie.text.pdf.PdfPCell(logoImage, false);
            logoCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
            headerTable.addCell(logoCell);

            // Center: company name + report title
            com.lowagie.text.pdf.PdfPCell centerCell = new com.lowagie.text.pdf.PdfPCell();
            centerCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            centerCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            centerCell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
            Paragraph companyName = new Paragraph("LOLC UNGUKA FINANCE", new Font(Font.HELVETICA, 14, Font.BOLD, new java.awt.Color(37, 99, 168)));
            companyName.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            Paragraph reportTitle = new Paragraph("Feedback Report", title);
            reportTitle.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            centerCell.addElement(companyName);
            centerCell.addElement(reportTitle);
            headerTable.addCell(centerCell);

            // Right: report period
            com.lowagie.text.pdf.PdfPCell periodCell = new com.lowagie.text.pdf.PdfPCell();
            periodCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            periodCell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
            periodCell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
            Paragraph periodLabel = new Paragraph("REPORT PERIOD", meta);
            periodLabel.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
            periodCell.addElement(periodLabel);
            if (dateRange != null) {
                String[] parts = dateRange.split(" to ");
                if (parts.length == 2) {
                    Paragraph p1 = new Paragraph(parts[0], new Font(Font.HELVETICA, 10, Font.BOLD, new java.awt.Color(15,23,42)));
                    p1.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
                    Paragraph dash = new Paragraph("—", meta);
                    dash.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
                    Paragraph p2 = new Paragraph(parts[1], new Font(Font.HELVETICA, 10, Font.BOLD, new java.awt.Color(15,23,42)));
                    p2.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
                    periodCell.addElement(p1); periodCell.addElement(dash); periodCell.addElement(p2);
                }
            } else {
                Paragraph allTime = new Paragraph("All Time", new Font(Font.HELVETICA, 10, Font.BOLD, new java.awt.Color(15,23,42)));
                allTime.setAlignment(com.lowagie.text.Element.ALIGN_RIGHT);
                periodCell.addElement(allTime);
            }
            headerTable.addCell(periodCell);
            doc.add(headerTable);

            // Divider
            PdfPTable div = new PdfPTable(1); div.setWidthPercentage(100); div.setSpacingBefore(6f);
            com.lowagie.text.pdf.PdfPCell dc = new com.lowagie.text.pdf.PdfPCell();
            dc.setBackgroundColor(new java.awt.Color(37,99,168)); dc.setFixedHeight(2f); dc.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            div.addCell(dc); doc.add(div);
            doc.add(new Paragraph(" "));

            // Section title
            Paragraph sectionTitle = new Paragraph("1. FEEDBACK DETAIL IN PERIOD", secHdr);
            doc.add(sectionTitle);
            doc.add(new Paragraph(" "));

            // Main feedback table
            PdfPTable table = new PdfPTable(9);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{0.4f, 1.8f, 1.2f, 1.4f, 1.2f, 1.2f, 1.2f, 1.2f, 1.4f});

            String[] headers = {"#","Customer","Phone","Email","Type","Category","Priority","Status","Date"};
            for (String h : headers) {
                com.lowagie.text.pdf.PdfPCell hc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(h, hdr));
                hc.setBackgroundColor(new java.awt.Color(37,99,168)); hc.setPadding(6);
                hc.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                hc.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                table.addCell(hc);
            }

            int rowNum = 1;
            for (rw.smartvoice.model.Feedback f : feedbacks) {
                boolean alt = rowNum % 2 == 0;
                java.awt.Color bg = alt ? new java.awt.Color(241,245,249) : java.awt.Color.WHITE;

                String custName = f.getCustomer() != null ? f.getCustomer().getFullName() : "—";
                String custPhone = f.getCustomer() != null && f.getCustomer().getPhone() != null ? f.getCustomer().getPhone() : "—";
                String custEmail = f.getCustomer() != null ? f.getCustomer().getEmail() : "—";
                String type = f.getType() != null ? f.getType().name() : "—";
                String category = f.getCategory() != null ? f.getCategory() : "—";
                String priority = f.getPriority() != null ? f.getPriority().name() : "—";
                String status = f.getStatus() != null ? f.getStatus().name() : "—";
                String date = f.getCreatedAt() != null
                    ? java.time.ZonedDateTime.ofInstant(f.getCreatedAt(), ZoneId.of("Africa/Kigali"))
                        .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    : "—";

                String[] vals = {String.valueOf(rowNum++), custName, custPhone, custEmail, type, category, priority, status, date};
                for (String v : vals) {
                    com.lowagie.text.pdf.PdfPCell c = new com.lowagie.text.pdf.PdfPCell(new Paragraph(v, cell));
                    c.setBackgroundColor(bg); c.setPadding(5); c.setBorderColor(new java.awt.Color(226,232,240));
                    table.addCell(c);
                }
            }

            // Total row
            com.lowagie.text.pdf.PdfPCell totalLabel = new com.lowagie.text.pdf.PdfPCell(new Paragraph("Total Feedback in Period", total));
            totalLabel.setColspan(2); totalLabel.setBackgroundColor(new java.awt.Color(235,245,255));
            totalLabel.setPadding(6); totalLabel.setBorderColor(new java.awt.Color(226,232,240));
            table.addCell(totalLabel);
            com.lowagie.text.pdf.PdfPCell totalVal = new com.lowagie.text.pdf.PdfPCell(new Paragraph(String.valueOf(feedbacks.size()), total));
            totalVal.setColspan(7); totalVal.setBackgroundColor(new java.awt.Color(235,245,255));
            totalVal.setPadding(6); totalVal.setBorderColor(new java.awt.Color(226,232,240));
            table.addCell(totalVal);

            doc.add(table);
            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(" "));

            // Signature section
            PdfPTable sigTable = new PdfPTable(2);
            sigTable.setWidthPercentage(80);
            sigTable.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            sigTable.setWidths(new float[]{1f, 1f});
            sigTable.setSpacingBefore(20f);

            for (String[] sig : new String[][]{{"PREPARED BY", "Administrator"}, {"APPROVED BY", "Manager"}}) {
                com.lowagie.text.pdf.PdfPCell sc = new com.lowagie.text.pdf.PdfPCell();
                sc.setBorder(com.lowagie.text.Rectangle.BOX); sc.setPadding(14);
                sc.setBorderColor(new java.awt.Color(200,200,200));
                Paragraph sigTitle = new Paragraph(sig[0], new Font(Font.HELVETICA, 9, Font.BOLD, new java.awt.Color(37,99,168)));
                sigTitle.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                sc.addElement(sigTitle);
                sc.addElement(new Paragraph(" "));
                sc.addElement(new Paragraph(" "));
                sc.addElement(new Paragraph("_______________________________", meta));
                Paragraph sigLabel = new Paragraph("Signature", meta);
                sigLabel.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                sc.addElement(sigLabel);
                Paragraph sigName = new Paragraph(sig[1], new Font(Font.HELVETICA, 9, Font.BOLD, new java.awt.Color(15,23,42)));
                sigName.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                sc.addElement(sigName);
                sc.addElement(new Paragraph(" "));
                Paragraph dateLabel = new Paragraph("Date: _______________________", meta);
                sc.addElement(dateLabel);
                sigTable.addCell(sc);
            }
            doc.add(sigTable);

            // Footer
            doc.add(new Paragraph(" "));
            PdfPTable footer = new PdfPTable(1); footer.setWidthPercentage(100);
            com.lowagie.text.pdf.PdfPCell fc = new com.lowagie.text.pdf.PdfPCell(
                new Paragraph("Generated on: " + java.time.ZonedDateTime.now(ZoneId.of("Africa/Kigali"))
                    .format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"))
                    + "  |  Generated by: " + generatedBy
                    + "  |  © " + java.time.Year.now().getValue() + " LOLC Unguka Finance. Confidential.", meta));
            fc.setBorder(com.lowagie.text.Rectangle.TOP); fc.setPaddingTop(6);
            fc.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            footer.addCell(fc);
            doc.add(footer);

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to generate detailed PDF: " + e.getMessage());
        }
    }
    public byte[] exportAnalyticsExcel() {
        AnalyticsResponse a = analytics();
        List<TrendPoint> trendPoints = trend(30);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet summarySheet = workbook.createSheet("Summary");
            int rowIdx = 0;
            summarySheet.createRow(rowIdx++).createCell(0).setCellValue("SmartVoice Analytics Report");
            Row gen = summarySheet.createRow(rowIdx++); gen.createCell(0).setCellValue("Generated"); gen.createCell(1).setCellValue(Instant.now().toString());
            rowIdx++;
            Row r1 = summarySheet.createRow(rowIdx++); r1.createCell(0).setCellValue("Total Feedback");          r1.createCell(1).setCellValue(a.total);
            Row r2 = summarySheet.createRow(rowIdx++); r2.createCell(0).setCellValue("Escalated");               r2.createCell(1).setCellValue(a.escalated);
            Row r3 = summarySheet.createRow(rowIdx++); r3.createCell(0).setCellValue("Average Rating");          r3.createCell(1).setCellValue(a.averageRating);
            Row r4 = summarySheet.createRow(rowIdx++); r4.createCell(0).setCellValue("Overdue Cases");           r4.createCell(1).setCellValue(a.overdueCases);
            Row r5 = summarySheet.createRow(rowIdx++); r5.createCell(0).setCellValue("Average Handling Hours");  r5.createCell(1).setCellValue(a.averageHandlingHours);
            createMapSheet(workbook, "By Status",      a.byStatus);
            createMapSheet(workbook, "By Type",        a.byType);
            createMapSheet(workbook, "By Priority",    a.byPriority);
            createMapSheet(workbook, "By Sentiment",   a.bySentiment);
            createMapSheet(workbook, "By Department",  a.byDepartment);
            createMapSheet(workbook, "Top Categories", a.topCategories);
            createTrendSheet(workbook, "Trend", trendPoints);
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Sheet s = workbook.getSheetAt(i);
                s.autoSizeColumn(0); s.autoSizeColumn(1); s.autoSizeColumn(2);
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to generate Excel: " + e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void addSection(Document doc, String title, Map<String, Long> data, Font sectionFont) throws Exception {
        doc.add(new Paragraph(" "));
        doc.add(new Paragraph(title, sectionFont));
        doc.add(new Paragraph(" "));
        doc.add(tableFromMap(data));
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont) {
        com.lowagie.text.pdf.PdfPCell lc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(label, labelFont));
        lc.setBackgroundColor(new java.awt.Color(241, 245, 249)); lc.setPadding(6); lc.setBorderColor(new java.awt.Color(226, 232, 240));
        com.lowagie.text.pdf.PdfPCell vc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(value, valueFont));
        vc.setPadding(6); vc.setBorderColor(new java.awt.Color(226, 232, 240));
        table.addCell(lc); table.addCell(vc);
    }

    private PdfPTable tableFromMap(Map<String, Long> map) {
        Font headerFont = new Font(Font.HELVETICA, 10, Font.BOLD,   java.awt.Color.WHITE);
        Font cellFont   = new Font(Font.HELVETICA, 10, Font.NORMAL, new java.awt.Color(15, 23, 42));
        Font numFont    = new Font(Font.HELVETICA, 10, Font.NORMAL, new java.awt.Color(100, 116, 139));

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.5f, 3f, 1.5f});

        for (String h : new String[]{"#", "Name", "Count"}) {
            com.lowagie.text.pdf.PdfPCell hc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(h, headerFont));
            hc.setBackgroundColor(new java.awt.Color(37, 99, 168)); hc.setPadding(7); hc.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            table.addCell(hc);
        }

        boolean alt = false; int rowNum = 1;
        for (var entry : map.entrySet()) {
            java.awt.Color bg = alt ? new java.awt.Color(241, 245, 249) : java.awt.Color.WHITE;
            com.lowagie.text.pdf.PdfPCell nc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(String.valueOf(rowNum++), numFont));
            nc.setBackgroundColor(bg); nc.setPadding(6); nc.setBorderColor(new java.awt.Color(226, 232, 240));
            com.lowagie.text.pdf.PdfPCell c1 = new com.lowagie.text.pdf.PdfPCell(new Paragraph(entry.getKey(), cellFont));
            c1.setBackgroundColor(bg); c1.setPadding(6); c1.setBorderColor(new java.awt.Color(226, 232, 240));
            com.lowagie.text.pdf.PdfPCell c2 = new com.lowagie.text.pdf.PdfPCell(new Paragraph(String.valueOf(entry.getValue()), cellFont));
            c2.setBackgroundColor(bg); c2.setPadding(6); c2.setBorderColor(new java.awt.Color(226, 232, 240));
            table.addCell(nc); table.addCell(c1); table.addCell(c2);
            alt = !alt;
        }
        return table;
    }

    // Two wide tables side by side — each section is a column pair
    private void addWideReport(Document doc, AnalyticsResponse a, boolean all, String reportType, Font sectionFont) throws Exception {
        Font headerFont = new Font(Font.HELVETICA, 9, Font.BOLD,   java.awt.Color.WHITE);
        Font nameFont   = new Font(Font.HELVETICA, 9, Font.NORMAL, new java.awt.Color(15, 23, 42));
        Font countFont  = new Font(Font.HELVETICA, 9, Font.BOLD,   new java.awt.Color(37, 99, 168));
        Font numFont    = new Font(Font.HELVETICA, 9, Font.NORMAL, new java.awt.Color(150, 150, 150));

        // Collect sections to show
        java.util.List<String[]> sectionTitles = new java.util.ArrayList<>();
        java.util.List<Map<String, Long>> sectionData = new java.util.ArrayList<>();

        if (all || reportType.equals("byStatus"))      { sectionTitles.add(new String[]{"By Status"});      sectionData.add(a.byStatus); }
        if (all || reportType.equals("byType"))        { sectionTitles.add(new String[]{"By Type"});        sectionData.add(a.byType); }
        if (all || reportType.equals("byPriority"))    { sectionTitles.add(new String[]{"By Priority"});    sectionData.add(a.byPriority); }
        if (all || reportType.equals("bySentiment"))   { sectionTitles.add(new String[]{"By Sentiment"});   sectionData.add(a.bySentiment); }
        if (all || reportType.equals("byDepartment"))  { sectionTitles.add(new String[]{"By Department"});  sectionData.add(a.byDepartment); }
        if (all || reportType.equals("topCategories")) { sectionTitles.add(new String[]{"Top Categories"}); sectionData.add(a.topCategories); }

        int total = sectionData.size();
        if (total == 0) return;

        // Split into groups of 3 per table row
        int groupSize = 3;
        for (int g = 0; g < total; g += groupSize) {
            int end = Math.min(g + groupSize, total);
            int cols = end - g;

            // Build column widths: # + (name + count) * cols
            float[] widths = new float[1 + cols * 2];
            widths[0] = 0.4f;
            for (int i = 0; i < cols; i++) { widths[1 + i*2] = 2.2f; widths[2 + i*2] = 0.8f; }

            PdfPTable table = new PdfPTable(1 + cols * 2);
            table.setWidthPercentage(100);
            table.setWidths(widths);
            table.setSpacingBefore(8f);

            // Header row
            com.lowagie.text.pdf.PdfPCell numH = new com.lowagie.text.pdf.PdfPCell(new Paragraph("#", headerFont));
            numH.setBackgroundColor(new java.awt.Color(37, 99, 168)); numH.setPadding(6); numH.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            table.addCell(numH);

            for (int i = g; i < end; i++) {
                String title = sectionTitles.get(i)[0];
                com.lowagie.text.pdf.PdfPCell th = new com.lowagie.text.pdf.PdfPCell(new Paragraph(title, headerFont));
                th.setBackgroundColor(new java.awt.Color(37, 99, 168)); th.setPadding(6); th.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                table.addCell(th);
                com.lowagie.text.pdf.PdfPCell ch = new com.lowagie.text.pdf.PdfPCell(new Paragraph("Count", headerFont));
                ch.setBackgroundColor(new java.awt.Color(37, 99, 168)); ch.setPadding(6); ch.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
                table.addCell(ch);
            }

            // Find max rows across sections in this group
            int maxRows = 0;
            for (int i = g; i < end; i++) maxRows = Math.max(maxRows, sectionData.get(i).size());

            // Convert maps to lists for indexed access
            java.util.List<java.util.List<Map.Entry<String,Long>>> lists = new java.util.ArrayList<>();
            for (int i = g; i < end; i++) lists.add(new java.util.ArrayList<>(sectionData.get(i).entrySet()));

            for (int row = 0; row < maxRows; row++) {
                boolean alt = row % 2 == 1;
                java.awt.Color bg = alt ? new java.awt.Color(241, 245, 249) : java.awt.Color.WHITE;

                com.lowagie.text.pdf.PdfPCell nc = new com.lowagie.text.pdf.PdfPCell(new Paragraph(String.valueOf(row + 1), numFont));
                nc.setBackgroundColor(bg); nc.setPadding(5); nc.setBorderColor(new java.awt.Color(226, 232, 240));
                table.addCell(nc);

                for (int i = 0; i < cols; i++) {
                    java.util.List<Map.Entry<String,Long>> list = lists.get(i);
                    if (row < list.size()) {
                        Map.Entry<String,Long> entry = list.get(row);
                        com.lowagie.text.pdf.PdfPCell c1 = new com.lowagie.text.pdf.PdfPCell(new Paragraph(entry.getKey(), nameFont));
                        c1.setBackgroundColor(bg); c1.setPadding(5); c1.setBorderColor(new java.awt.Color(226, 232, 240));
                        com.lowagie.text.pdf.PdfPCell c2 = new com.lowagie.text.pdf.PdfPCell(new Paragraph(String.valueOf(entry.getValue()), countFont));
                        c2.setBackgroundColor(bg); c2.setPadding(5); c2.setBorderColor(new java.awt.Color(226, 232, 240));
                        table.addCell(c1); table.addCell(c2);
                    } else {
                        // Empty cells to fill the row
                        com.lowagie.text.pdf.PdfPCell empty1 = new com.lowagie.text.pdf.PdfPCell(new Paragraph("", nameFont));
                        empty1.setBackgroundColor(bg); empty1.setPadding(5); empty1.setBorderColor(new java.awt.Color(226, 232, 240));
                        com.lowagie.text.pdf.PdfPCell empty2 = new com.lowagie.text.pdf.PdfPCell(new Paragraph("", nameFont));
                        empty2.setBackgroundColor(bg); empty2.setPadding(5); empty2.setBorderColor(new java.awt.Color(226, 232, 240));
                        table.addCell(empty1); table.addCell(empty2);
                    }
                }
            }
            doc.add(table);
        }
    }

    private void createMapSheet(Workbook workbook, String sheetName, Map<String, Long> map) {
        Sheet sheet = workbook.createSheet(sheetName);
        int rowIdx = 0;
        Row header = sheet.createRow(rowIdx++);
        header.createCell(0).setCellValue("Name"); header.createCell(1).setCellValue("Count");
        for (var entry : map.entrySet()) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(entry.getKey()); row.createCell(1).setCellValue(entry.getValue());
        }
    }

    private void createTrendSheet(Workbook workbook, String sheetName, List<TrendPoint> points) {
        Sheet sheet = workbook.createSheet(sheetName);
        int rowIdx = 0;
        Row header = sheet.createRow(rowIdx++);
        header.createCell(0).setCellValue("Date"); header.createCell(1).setCellValue("Count");
        for (TrendPoint p : points) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(String.valueOf(p.getDate())); row.createCell(1).setCellValue(p.getCount());
        }
    }
}


