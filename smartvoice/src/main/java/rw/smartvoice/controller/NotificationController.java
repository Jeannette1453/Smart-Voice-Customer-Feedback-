package rw.smartvoice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.NotificationResponse;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.NotificationService;
import rw.smartvoice.util.SecurityUtil;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(NotificationService notificationService, UserRepository userRepository) {
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

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<List<NotificationResponse>> my() {
        return ResponseEntity.ok(notificationService.my(currentUserId()));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/unread-count")
    public ResponseEntity<Long> unreadCount() {
        return ResponseEntity.ok(notificationService.unreadCount(currentUserId()));
    }

    // ✅ click-to-read
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markRead(id, currentUserId()));
    }

    // ✅ mark all read button
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/me/read-all")
    public ResponseEntity<Integer> markAllRead() {
        return ResponseEntity.ok(notificationService.markAllRead(currentUserId()));
    }
}