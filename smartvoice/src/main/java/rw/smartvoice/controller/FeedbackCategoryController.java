package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.FeedbackCategoryRequest;
import rw.smartvoice.model.FeedbackCategory;
import rw.smartvoice.service.FeedbackCategoryService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/categories")
public class FeedbackCategoryController {

    private final FeedbackCategoryService feedbackCategoryService;

    public FeedbackCategoryController(FeedbackCategoryService feedbackCategoryService) {
        this.feedbackCategoryService = feedbackCategoryService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<FeedbackCategory>> all() {
        return ResponseEntity.ok(feedbackCategoryService.all());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<FeedbackCategory> create(@Valid @RequestBody FeedbackCategoryRequest req) {
        return ResponseEntity.ok(feedbackCategoryService.create(req));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        feedbackCategoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}