package rw.smartvoice.service;

import jakarta.transaction.Transactional;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rw.smartvoice.dto.AuthResponse;
import rw.smartvoice.dto.ForgotPasswordRequest;
import rw.smartvoice.dto.GoogleLoginRequest;
import rw.smartvoice.dto.LoginRequest;
import rw.smartvoice.dto.RegisterRequest;
import rw.smartvoice.dto.ResetPasswordRequest;
import rw.smartvoice.dto.VerifyOtpRequest;
import rw.smartvoice.model.LoginOtp;
import rw.smartvoice.model.PasswordResetToken;
import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.LoginOtpRepository;
import rw.smartvoice.repository.PasswordResetTokenRepository;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.security.JwtService;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final LoginOtpRepository loginOtpRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${google.client-id}")
    private String googleClientId;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       EmailService emailService,
                       LoginOtpRepository loginOtpRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
        this.loginOtpRepository = loginOtpRepository;
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
        if (req.phone != null && !req.phone.isBlank()) user.setPhone(req.phone.trim());

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

    @Transactional
    public void login(LoginRequest req) {
        String email = req.email.toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Account disabled");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(req.password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Delete any previous OTPs for this user
        loginOtpRepository.deleteByUser_Id(user.getId());

        // Generate 6-digit OTP
        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));

        LoginOtp otp = new LoginOtp();
        otp.setUser(user);
        otp.setCode(code);
        otp.setExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        loginOtpRepository.save(otp);

        try {
            emailService.sendSimpleEmail(
                    user.getEmail(),
                    "SmartVoice Login Code",
                    "Hello " + user.getFullName() + ",\n\n"
                            + "Your login verification code is: " + code + "\n\n"
                            + "This code expires in 10 minutes.\n"
                            + "If you did not request this, please ignore this email."
            );
        } catch (Exception e) {
            System.out.println("OTP EMAIL ERROR => " + e.getMessage());
        }
    }

    public AuthResponse verifyOtp(VerifyOtpRequest req) {
        String email = req.email.toLowerCase().trim();

        LoginOtp otp = loginOtpRepository
                .findTopByUser_EmailOrderByExpiresAtDesc(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired code"));

        if (otp.isUsed()) {
            throw new IllegalArgumentException("Code already used");
        }
        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Code expired");
        }
        if (!otp.getCode().equals(req.code.trim())) {
            throw new IllegalArgumentException("Invalid code");
        }

        otp.setUsed(true);
        loginOtpRepository.save(otp);

        User user = otp.getUser();
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), user.getEmail(), user.getFullName());
    }

    @Transactional
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

    @Transactional
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

    public AuthResponse googleLogin(GoogleLoginRequest req) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(req.idToken);
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail().toLowerCase().trim();
            String name = (String) payload.get("name");

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setFullName(name != null ? name : email);
                newUser.setRole(Role.CUSTOMER);
                newUser.setEnabled(true);
                newUser.setPasswordHash(""); // Google-only user, no password
                return userRepository.save(newUser);
            });

            if (!user.isEnabled()) {
                throw new IllegalArgumentException("Account disabled");
            }

            String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
            return new AuthResponse(token, user.getRole().name(), user.getEmail(), user.getFullName());

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Google authentication failed: " + e.getMessage());
        }
    }
}