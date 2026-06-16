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
import rw.smartvoice.repository.FeedbackHistoryRepository;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.FeedbackService;
import rw.smartvoice.util.SecurityUtil;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final UserRepository userRepository;
    private final FeedbackHistoryRepository feedbackHistoryRepository;

    public FeedbackController(FeedbackService feedbackService,
                              UserRepository userRepository,
                              FeedbackHistoryRepository feedbackHistoryRepository) {
        this.feedbackService = feedbackService;
        this.userRepository = userRepository;
        this.feedbackHistoryRepository = feedbackHistoryRepository;
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