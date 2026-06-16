package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.FeedbackRatingRequest;
import rw.smartvoice.dto.FeedbackRatingResponse;
import rw.smartvoice.service.FeedbackRatingService;

import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackRatingController {

    private final FeedbackRatingService feedbackRatingService;

    public FeedbackRatingController(FeedbackRatingService feedbackRatingService) {
        this.feedbackRatingService = feedbackRatingService;
    }

    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/{feedbackId}/rating")
    public ResponseEntity<FeedbackRatingResponse> save(
            @PathVariable UUID feedbackId,
            @Valid @RequestBody FeedbackRatingRequest req
    ) {
        return ResponseEntity.ok(feedbackRatingService.save(feedbackId, req));
    }

    @PreAuthorize("hasAnyRole('CUSTOMER','STAFF','MANAGER','ADMIN')")
    @GetMapping("/{feedbackId}/rating")
    public ResponseEntity<FeedbackRatingResponse> getOne(@PathVariable UUID feedbackId) {
        return ResponseEntity.ok(feedbackRatingService.getByFeedback(feedbackId));
    }
}