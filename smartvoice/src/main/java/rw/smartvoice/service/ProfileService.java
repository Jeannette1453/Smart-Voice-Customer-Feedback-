package rw.smartvoice.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rw.smartvoice.dto.ChangePasswordRequest;
import rw.smartvoice.dto.ProfileResponse;
import rw.smartvoice.dto.UpdateProfileRequest;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.util.SecurityUtil;

@Service
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User currentUserEntity() {
        String email = SecurityUtil.currentEmail();
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("User not authenticated");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public ProfileResponse me() {
        return ProfileResponse.from(currentUserEntity());
    }

    public ProfileResponse updateMyProfile(UpdateProfileRequest req) {
        User user = currentUserEntity();
        user.setFullName(req.fullName.trim());
        if (req.phone != null && !req.phone.isBlank()) user.setPhone(req.phone.trim());
        return ProfileResponse.from(userRepository.save(user));
    }

    public void changePassword(ChangePasswordRequest req) {
        User user = currentUserEntity();

        if (!passwordEncoder.matches(req.currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword));
        userRepository.save(user);
    }
}