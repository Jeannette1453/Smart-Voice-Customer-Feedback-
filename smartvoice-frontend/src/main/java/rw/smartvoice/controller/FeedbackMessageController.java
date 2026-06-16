package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.CreateFeedbackMessageRequest;
import rw.smartvoice.dto.FeedbackMessageResponse;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.FeedbackMessageService;
import rw.smartvoice.util.SecurityUtil;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackMessageController {

    private final FeedbackMessageService feedbackMessageService;
    private final UserRepository userRepository;

    public FeedbackMessageController(FeedbackMessageService feedbackMessageService,
                                     UserRepository userRepository) {
        this.feedbackMessageService = feedbackMessageService;
        this.userRepository = userRepository;
    }

    private UUID currentUserId() {
        String email = SecurityUtil.currentEmail();
        if (email == null) throw new IllegalArgumentException("Not authenticated");

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<FeedbackMessageResponse>> getMessages(@PathVariable UUID id) {
        return ResponseEntity.ok(feedbackMessageService.getMessages(id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<FeedbackMessageResponse> sendMessage(@PathVariable UUID id,
                                                              @Valid @RequestBody CreateFeedbackMessageRequest req) {
        return ResponseEntity.ok(
                feedbackMessageService.sendMessage(id, currentUserId(), req.message)
        );
    }
}
