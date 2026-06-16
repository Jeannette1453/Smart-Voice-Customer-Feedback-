package rw.smartvoice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rw.smartvoice.dto.AuthResponse;
import rw.smartvoice.dto.ForgotPasswordRequest;
import rw.smartvoice.dto.LoginRequest;
import rw.smartvoice.dto.RegisterRequest;
import rw.smartvoice.dto.ResetPasswordRequest;
import rw.smartvoice.model.PasswordResetToken;
import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.PasswordResetTokenRepository;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.security.JwtService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
    }

    public AuthResponse register(RegisterRequest req) {
        String email = req.email.toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setFullName(req.fullName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.password));

        Role role = (req.role == null) ? Role.CUSTOMER : req.role;
        user.setRole(role);
        user.setEnabled(true);

        userRepository.save(user);

        try {
            emailService.sendSimpleEmail(
                    user.getEmail(),
                    "Welcome to SmartVoice",
                    "Hello " + user.getFullName() + ",\n\nYour account has been created successfully."
            );
        } catch (Exception e) {
            System.out.println("WELCOME EMAIL ERROR => " + e.getMessage());
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return new AuthResponse(token, user.getRole().name(), user.getEmail(), user.getFullName());
    }

    public AuthResponse login(LoginRequest req) {
        String email = req.email.toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Account disabled");
        }

        if (!passwordEncoder.matches(req.password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return new AuthResponse(token, user.getRole().name(), user.getEmail(), user.getFullName());
    }

    public void forgotPassword(ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.email.toLowerCase().trim())
                .orElse(null);

        if (user == null) {
            return;
        }

        String token = UUID.randomUUID().toString();

        PasswordResetToken reset = new PasswordResetToken();
        reset.setToken(token);
        reset.setUser(user);
        reset.setExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
        reset.setUsed(false);

        passwordResetTokenRepository.save(reset);

        String link = frontendUrl + "/reset-password?token=" + token;

        try {
            emailService.sendSimpleEmail(
                    user.getEmail(),
                    "SmartVoice Password Reset",
                    "Hello " + user.getFullName() + ",\n\n"
                            + "Click this link to reset your password:\n"
                            + link + "\n\n"
                            + "This link expires in 30 minutes."
            );
        } catch (Exception e) {
            System.out.println("RESET EMAIL ERROR => " + e.getMessage());
        }
    }

    public void resetPassword(ResetPasswordRequest req) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(req.token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

        if (token.isUsed()) {
            throw new IllegalArgumentException("Reset token already used");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Reset token expired");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(req.newPassword));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);
    }
}