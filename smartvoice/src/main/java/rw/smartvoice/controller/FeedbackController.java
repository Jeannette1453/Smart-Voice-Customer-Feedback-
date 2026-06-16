package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.AssignFeedbackRequest;
import rw.smartvoice.dto.CreateFeedbackRequest;
import rw.smartvoice.dto.EscalateRequest;
import rw.smartvoice.dto.FeedbackHistoryResponse;
import rw.smartvoice.dto.FeedbackResponse;
import rw.smartvoice.dto.UpdateStatusRequest;
import rw.smartvoice.model.FeedbackStatus;
import rw.smartvoice.repository.FeedbackHistoryRepository;
import rw.smartvoice.repository.FeedbackRepository;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.FeedbackService;
import rw.smartvoice.util.SecurityUtil;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final UserRepository userRepository;
    private final FeedbackHistoryRepository feedbackHistoryRepository;
    private final FeedbackRepository feedbackRepository;

    public FeedbackController(FeedbackService feedbackService,
                              UserRepository userRepository,
                              FeedbackHistoryRepository feedbackHistoryRepository,
                              FeedbackRepository feedbackRepository) {
        this.feedbackService = feedbackService;
        this.userRepository = userRepository;
        this.feedbackHistoryRepository = feedbackHistoryRepository;
        this.feedbackRepository = feedbackRepository;
    }

    private UUID currentUserId() {
        String email = SecurityUtil.currentEmail();
        if (email == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    private String currentEmail() {
        String email = SecurityUtil.currentEmail();
        if (email == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return email;
    }

    // CUSTOMER: submit feedback
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping
    public ResponseEntity<FeedbackResponse> create(@Valid @RequestBody CreateFeedbackRequest req) {
        return ResponseEntity.status(201)
                .body(feedbackService.createFeedback(currentUserId(), req));
    }

    // CUSTOMER: view own feedback
    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/me")
    public ResponseEntity<List<FeedbackResponse>> myFeedback() {
        return ResponseEntity.ok(feedbackService.getMyFeedback(currentUserId()));
    }

    // STAFF / MANAGER / ADMIN: view assigned feedback
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @GetMapping("/assigned/me")
    public ResponseEntity<List<FeedbackResponse>> assignedToMe() {
        return ResponseEntity.ok(feedbackService.getAssignedToStaff(currentUserId()));
    }

    // MANAGER / ADMIN: view all feedback
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping
    public ResponseEntity<List<FeedbackResponse>> all() {
        return ResponseEntity.ok(feedbackService.getAll());
    }

    // Any authenticated user can open details
    // Service should enforce ownership/assignment rules if needed
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<FeedbackResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(feedbackService.getOne(id));
    }

    // MANAGER / ADMIN: assign feedback
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @PatchMapping("/{id}/assign")
    public ResponseEntity<FeedbackResponse> assign(@PathVariable UUID id,
                                                   @RequestBody AssignFeedbackRequest req) {
        return ResponseEntity.ok(feedbackService.assign(id, req));
    }

    // STAFF can update only their assigned feedback
    // MANAGER / ADMIN can update any feedback
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<FeedbackResponse> updateStatus(@PathVariable UUID id,
                                                         @Valid @RequestBody UpdateStatusRequest req) {
        return ResponseEntity.ok(
                feedbackService.updateStatusByActor(id, req.status, currentEmail(), req.note)
        );
    }

    // MANAGER / ADMIN: escalate or remove escalation
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @PatchMapping("/{id}/escalate")
    public ResponseEntity<FeedbackResponse> escalate(@PathVariable UUID id,
                                                     @RequestBody EscalateRequest req) {
        return ResponseEntity.ok(feedbackService.setEscalated(id, req.escalated));
    }

    // MANAGER/ADMIN: overdue feedback list
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/overdue")
    public ResponseEntity<List<FeedbackResponse>> overdue() {
        Instant limit = Instant.now().minus(48, ChronoUnit.HOURS);
        List<FeedbackResponse> list = feedbackRepository
                .findByStatusInAndCreatedAtBeforeWithJoins(
                        List.of(FeedbackStatus.NEW, FeedbackStatus.ASSIGNED, FeedbackStatus.IN_PROGRESS),
                        limit)
                .stream().map(FeedbackResponse::fromEntity).toList();
        return ResponseEntity.ok(list);
    }

    // MANAGER/ADMIN: staff workload summary
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/staff-workload")
    public ResponseEntity<List<Map<String, Object>>> staffWorkload() {
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Object[] row : feedbackRepository.countOpenCasesByStaff()) {
            UUID staffId = (UUID) row[0];
            long count = ((Number) row[1]).longValue();
            userRepository.findById(staffId).ifPresent(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("staffId", staffId);
                m.put("staffName", u.getFullName());
                m.put("staffEmail", u.getEmail());
                m.put("openCases", count);
                result.add(m);
            });
        }
        // Also add staff with 0 open cases
        userRepository.findByRole(rw.smartvoice.model.Role.STAFF).forEach(u -> {
            boolean found = result.stream().anyMatch(m -> m.get("staffId").equals(u.getId()));
            if (!found) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("staffId", u.getId());
                m.put("staffName", u.getFullName());
                m.put("staffEmail", u.getEmail());
                m.put("openCases", 0L);
                result.add(m);
            }
        });
        result.sort((a, b) -> Long.compare((Long)b.get("openCases"), (Long)a.get("openCases")));
        return ResponseEntity.ok(result);
    }

    // Feedback history
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/history")
    public ResponseEntity<List<FeedbackHistoryResponse>> history(@PathVariable UUID id) {
        List<FeedbackHistoryResponse> list = feedbackHistoryRepository
                .findByFeedback_IdOrderByCreatedAtDesc(id)
                .stream()
                .map(FeedbackHistoryResponse::fromEntity)
                .toList();

        return ResponseEntity.ok(list);
    }
}