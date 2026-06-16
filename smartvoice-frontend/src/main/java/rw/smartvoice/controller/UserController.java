package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.CreateUserRequest;
import rw.smartvoice.dto.UpdateUserRequest;
import rw.smartvoice.dto.UserLiteResponse;
import rw.smartvoice.dto.UserResponse;
import rw.smartvoice.model.Role;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.UserService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
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
    // ADMIN: Delete user
    // =========================
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
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