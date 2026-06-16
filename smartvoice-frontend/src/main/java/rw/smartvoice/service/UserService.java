package rw.smartvoice.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rw.smartvoice.dto.CreateUserRequest;
import rw.smartvoice.dto.UpdateUserRequest;
import rw.smartvoice.dto.UserResponse;
import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.util.SecurityUtil;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse create(CreateUserRequest req) {
        String email = req.email.toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User u = new User();
        u.setFullName(req.fullName);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(req.password));
        u.setRole(req.role);
        u.setEnabled(true);

        return UserResponse.fromEntity(userRepository.save(u));
    }

    public List<UserResponse> all() {
        return userRepository.findAll().stream().map(UserResponse::fromEntity).toList();
    }

    public User getEntity(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public UserResponse get(UUID id) {
        return UserResponse.fromEntity(getEntity(id));
    }

    public List<UserResponse> byRole(Role role) {
        return userRepository.findByRole(role).stream().map(UserResponse::fromEntity).toList();
    }

    public boolean currentUserIsAdmin() {
        String email = SecurityUtil.currentEmail();
        if (email == null) return false;

        return userRepository.findByEmail(email)
                .map(u -> u.getRole() == Role.ADMIN)
                .orElse(false);
    }

    public UserResponse update(UUID id, UpdateUserRequest req) {
        User u = getEntity(id);

        if (req.fullName != null && !req.fullName.isBlank()) {
            u.setFullName(req.fullName.trim());
        }
        if (req.role != null) {
            u.setRole(req.role);
        }
        if (req.enabled != null) {
            u.setEnabled(req.enabled);
        }

        // ✅ optional password reset by admin
        if (req.password != null && !req.password.isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(req.password));
        }

        return UserResponse.fromEntity(userRepository.save(u));
    }

    public void delete(UUID id) {
        User u = getEntity(id);
        userRepository.delete(u);
    }
}
