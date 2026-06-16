package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.AddCommentRequest;
import rw.smartvoice.model.FeedbackComment;
import rw.smartvoice.service.CommentService;
import rw.smartvoice.util.SecurityUtil;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedback/{feedbackId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) { this.commentService = commentService; }

    @PostMapping
    public ResponseEntity<FeedbackComment> add(@PathVariable UUID feedbackId, @Valid @RequestBody AddCommentRequest req) {
        String email = SecurityUtil.currentEmail();
        return ResponseEntity.status(201).body(commentService.add(feedbackId, req.message, email));
    }

    @GetMapping
    public ResponseEntity<List<FeedbackComment>> list(@PathVariable UUID feedbackId) {
        return ResponseEntity.ok(commentService.list(feedbackId));
    }
}
