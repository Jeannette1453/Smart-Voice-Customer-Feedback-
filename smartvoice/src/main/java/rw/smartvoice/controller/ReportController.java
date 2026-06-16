package rw.smartvoice.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.AnalyticsResponse;
import rw.smartvoice.dto.TrendPoint;
import rw.smartvoice.dto.UserLiteResponse;
import rw.smartvoice.model.Role;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.ReportService;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final UserRepository userRepository;

    public ReportController(ReportService reportService, UserRepository userRepository) {
        this.reportService = reportService;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/users-by-role")
    public ResponseEntity<List<UserLiteResponse>> usersByRole(@RequestParam String role) {
        try {
            Role r = Role.valueOf(role.toUpperCase());
            List<UserLiteResponse> users = userRepository.findByRole(r).stream()
                    .map(UserLiteResponse::from).toList();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/summary")
    public ResponseEntity<AnalyticsResponse> summary() {
        return ResponseEntity.ok(reportService.analytics());
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> analytics(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String userId) {
        if (userId != null && !userId.isBlank()) {
            return ResponseEntity.ok(reportService.analyticsForUser(UUID.fromString(userId)));
        }
        if (from != null && to != null && !from.isBlank() && !to.isBlank()) {
            Instant fromInst = LocalDate.parse(from).atStartOfDay(ZoneId.of("Africa/Kigali")).toInstant();
            Instant toInst = LocalDate.parse(to).plusDays(1).atStartOfDay(ZoneId.of("Africa/Kigali")).toInstant();
            return ResponseEntity.ok(reportService.analyticsBetween(fromInst, toInst));
        }
        return ResponseEntity.ok(reportService.analytics());
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/trend")
    public ResponseEntity<List<TrendPoint>> trend(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(reportService.trend(days));
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false, defaultValue = "all") String reportType,
            @RequestParam(required = false) String userId) {
        String generatedBy = userDetails != null ? userDetails.getUsername() : "Unknown";

        Instant fromInst = null, toInst = null;
        if (from != null && !from.isBlank() && to != null && !to.isBlank()) {
            fromInst = LocalDate.parse(from).atStartOfDay(ZoneId.of("Africa/Kigali")).toInstant();
            toInst   = LocalDate.parse(to).plusDays(1).atStartOfDay(ZoneId.of("Africa/Kigali")).toInstant();
        }

        String dateRange = (from != null && to != null && !from.isBlank() && !to.isBlank())
                ? from + " to " + to : null;

        String userLabel = null;
        UUID userUuid = null;
        if (userId != null && !userId.isBlank()) {
            userUuid = UUID.fromString(userId);
            userLabel = userRepository.findById(userUuid)
                    .map(u -> u.getFullName() + " (" + u.getEmail() + ")")
                    .orElse(userId);
        }

        byte[] pdf = reportService.exportAnalyticsPdf(generatedBy, fromInst, toInst, reportType, dateRange, userUuid, userLabel);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"smartvoice-report.pdf\"")
                .body(pdf);
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/export/pdf/detailed")
    public ResponseEntity<byte[]> exportDetailedPdf(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String filterType,
            @RequestParam(required = false) String filterSentiment,
            @RequestParam(required = false) String filterDepartment) {
        String generatedBy = userDetails != null ? userDetails.getUsername() : "Unknown";
        Instant fromInst = null, toInst = null;
        if (from != null && !from.isBlank() && to != null && !to.isBlank()) {
            fromInst = LocalDate.parse(from).atStartOfDay(ZoneId.of("Africa/Kigali")).toInstant();
            toInst   = LocalDate.parse(to).plusDays(1).atStartOfDay(ZoneId.of("Africa/Kigali")).toInstant();
        }
        String dateRange = (from != null && to != null && !from.isBlank() && !to.isBlank()) ? from + " to " + to : null;
        UUID userUuid = (userId != null && !userId.isBlank()) ? UUID.fromString(userId) : null;
        byte[] pdf = reportService.exportDetailedPdf(generatedBy, fromInst, toInst, userUuid, dateRange,
                filterType, filterSentiment, filterDepartment);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"smartvoice-feedback-report.pdf\"")
                .body(pdf);
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel() {
        byte[] excel = reportService.exportAnalyticsExcel();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"smartvoice-report.xlsx\"")
                .body(excel);
    }
}