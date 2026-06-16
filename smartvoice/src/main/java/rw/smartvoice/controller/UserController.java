package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.CreateUserRequest;
import rw.smartvoice.dto.OutreachRequest;
import rw.smartvoice.dto.UpdateUserRequest;
import rw.smartvoice.dto.UserLiteResponse;
import rw.smartvoice.dto.UserResponse;
import rw.smartvoice.model.Role;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.EmailService;
import rw.smartvoice.service.NotificationService;
import rw.smartvoice.service.UserService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public UserController(UserService userService, UserRepository userRepository,
                          NotificationService notificationService, EmailService emailService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    // =========================
    // ADMIN: Create user
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {
        return ResponseEntity.status(201).body(userService.create(req));
    }

    // =========================
    // ADMIN: List all users
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserResponse>> all() {
        return ResponseEntity.ok(userService.all());
    }

    // =========================
    // ADMIN: Get one user
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.get(id));
    }

    // =========================
    // ADMIN: Update user
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable UUID id, @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(userService.update(id, req));
    }

    // =========================
    // ADMIN: Toggle enabled
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/enabled")
    public ResponseEntity<UserResponse> setEnabled(@PathVariable UUID id, @RequestParam boolean value) {
        rw.smartvoice.dto.UpdateUserRequest req = new rw.smartvoice.dto.UpdateUserRequest();
        req.enabled = value;
        return ResponseEntity.ok(userService.update(id, req));
    }

    // =========================
    // ADMIN: Delete user
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // =========================
    // ADMIN/MANAGER: Contact a customer directly
    // =========================
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    @PostMapping("/outreach")
    public ResponseEntity<java.util.Map<String, String>> outreach(
            @Valid @RequestBody OutreachRequest req,
            @AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {

        rw.smartvoice.model.User customer = userRepository.findById(req.customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        String senderEmail = userDetails != null ? userDetails.getUsername() : "noreply@smartvoice.local";
        rw.smartvoice.model.User sender = userRepository.findByEmail(senderEmail).orElse(null);
        String senderName = sender != null ? sender.getFullName() : "SmartVoice Team";

        try {
            emailService.sendSimpleEmail(
                    customer.getEmail(),
                    req.subject,
                    "Hello " + customer.getFullName() + ",\n\n" + req.message + "\n\nBest regards,\n" + senderName
            );
        } catch (Exception e) {
            System.out.println("OUTREACH EMAIL ERROR => " + e.getMessage());
        }

        notificationService.createNotification(
                customer.getId(), req.subject, req.message, senderName, senderEmail);

        return ResponseEntity.ok(java.util.Map.of("message", "Message sent to " + customer.getFullName()));
    }

    // =========================
    // MANAGER/ADMIN: List users by role (for customer outreach)
    // =========================
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/by-role")
    public ResponseEntity<List<UserResponse>> byRole(@RequestParam String role) {
        try {
            Role r = Role.valueOf(role.toUpperCase());
            return ResponseEntity.ok(userService.byRole(r));
        } catch (Exception e) {
            return ResponseEntity.ok(List.of());
        }
    }

    // =========================
    // STAFF/MANAGER/ADMIN: List staff for assignment dropdown
    // (returns SAFE lite data only)
    // =========================
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @GetMapping("/staff")
    public ResponseEntity<List<UserLiteResponse>> staff() {
        var roles = List.of(Role.STAFF, Role.MANAGER, Role.ADMIN);

        var list = userRepository.findByRoleIn(roles).stream()
                .map(UserLiteResponse::from)
                .toList();

        return ResponseEntity.ok(list);
    }
}