package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.CreateRatingRequest;
import rw.smartvoice.dto.RatingResponse;
import rw.smartvoice.service.SatisfactionRatingService;
import rw.smartvoice.util.SecurityUtil;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class SatisfactionRatingController {

    private final SatisfactionRatingService ratingService;

    public SatisfactionRatingController(SatisfactionRatingService ratingService) {
        this.ratingService = ratingService;
    }

    private String email() {
        String e = SecurityUtil.currentEmail();
        if (e == null) throw new IllegalArgumentException("Not authenticated");
        return e;
    }

    // ✅ Customer submits rating
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/feedback/{feedbackId}/rating")
    public ResponseEntity<RatingResponse> create(@PathVariable UUID feedbackId,
                                                 @Valid @RequestBody CreateRatingRequest req) {
        return ResponseEntity.status(201).body(ratingService.create(feedbackId, req, email()));
    }

    // ✅ Anyone authenticated can view rating (with ownership check in service)
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/feedback/{feedbackId}/rating")
    public ResponseEntity<RatingResponse> get(@PathVariable UUID feedbackId) {
        return ResponseEntity.ok(ratingService.getForFeedback(feedbackId, email()));
    }
}