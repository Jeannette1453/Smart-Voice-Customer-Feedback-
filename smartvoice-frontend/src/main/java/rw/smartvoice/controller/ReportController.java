package rw.smartvoice.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.AnalyticsResponse;
import rw.smartvoice.dto.DashboardReportResponse;
import rw.smartvoice.dto.PerformanceResponse;
import rw.smartvoice.dto.TrendPoint;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.NotificationService;
import rw.smartvoice.service.ReportService;
import rw.smartvoice.util.SecurityUtil;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public ReportController(ReportService reportService,
                            NotificationService notificationService,
                            UserRepository userRepository) {
        this.reportService = reportService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    private UUID currentUserId() {
        String email = SecurityUtil.currentEmail();
        if (email == null) throw new IllegalArgumentException("Not authenticated");

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsResponse> summary() {
        return ResponseEntity.ok(reportService.analytics());
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> analytics() {
        return ResponseEntity.ok(reportService.analytics());
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/trend")
    public ResponseEntity<List<TrendPoint>> trend(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(reportService.trend(days));
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/performance")
    public ResponseEntity<PerformanceResponse> performance() {
        return ResponseEntity.ok(reportService.performance());
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardReportResponse> dashboard() {
        long unread = notificationService.unreadCount(currentUserId());
        return ResponseEntity.ok(reportService.dashboardReport(unread));
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf() {
        byte[] pdf = reportService.exportAnalyticsPdf();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"smartvoice-report.pdf\"")
                .body(pdf);
    }
}