package rw.smartvoice.service;

import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import rw.smartvoice.dto.CreateUserRequest;
import rw.smartvoice.dto.UpdateUserRequest;
import rw.smartvoice.dto.UserResponse;
import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.AttachmentRepository;
import rw.smartvoice.repository.FeedbackCommentRepository;
import rw.smartvoice.repository.FeedbackHistoryRepository;
import rw.smartvoice.repository.FeedbackMessageRepository;
import rw.smartvoice.repository.FeedbackRatingRepository;
import rw.smartvoice.repository.FeedbackRepository;
import rw.smartvoice.repository.LoginOtpRepository;
import rw.smartvoice.repository.NotificationRepository;
import rw.smartvoice.repository.PasswordResetTokenRepository;
import rw.smartvoice.repository.SatisfactionRatingRepository;
import rw.smartvoice.repository.SurveyResponseRepository;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.repository.DepartmentRepository;
import rw.smartvoice.util.SecurityUtil;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FeedbackRepository feedbackRepository;
    private final FeedbackCommentRepository commentRepository;
    private final FeedbackHistoryRepository historyRepository;
    private final AttachmentRepository attachmentRepository;
    private final FeedbackRatingRepository ratingRepository;
    private final FeedbackMessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SatisfactionRatingRepository satisfactionRatingRepository;
    private final SurveyResponseRepository surveyResponseRepository;
    private final LoginOtpRepository loginOtpRepository;
    private final DepartmentRepository departmentRepository;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       FeedbackRepository feedbackRepository,
                       FeedbackCommentRepository commentRepository,
                       FeedbackHistoryRepository historyRepository,
                       AttachmentRepository attachmentRepository,
                       FeedbackRatingRepository ratingRepository,
                       FeedbackMessageRepository messageRepository,
                       NotificationRepository notificationRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       SatisfactionRatingRepository satisfactionRatingRepository,
                       SurveyResponseRepository surveyResponseRepository,
                       LoginOtpRepository loginOtpRepository,
                       DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.feedbackRepository = feedbackRepository;
        this.commentRepository = commentRepository;
        this.historyRepository = historyRepository;
        this.attachmentRepository = attachmentRepository;
        this.ratingRepository = ratingRepository;
        this.messageRepository = messageRepository;
        this.notificationRepository = notificationRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.satisfactionRatingRepository = satisfactionRatingRepository;
        this.surveyResponseRepository = surveyResponseRepository;
        this.loginOtpRepository = loginOtpRepository;
        this.departmentRepository = departmentRepository;
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
        if (req.phone != null && !req.phone.isBlank()) u.setPhone(req.phone.trim());
        u.setRole(req.role);
        u.setEnabled(true);
        if (req.departmentId != null) {
            departmentRepository.findById(req.departmentId).ifPresent(u::setDepartment);
        }

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
        if (req.phone != null && !req.phone.isBlank()) {
            u.setPhone(req.phone.trim());
        }
        if (req.departmentId != null) {
            departmentRepository.findById(req.departmentId).ifPresent(u::setDepartment);
        }
        if (req.password != null && !req.password.isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(req.password));
        }

        return UserResponse.fromEntity(userRepository.save(u));
    }

    @Transactional
    public void delete(UUID id) {
        User u = getEntity(id);

        // 1. Delete notifications for this user
        notificationRepository.deleteByUser_Id(id);

        // 2. Delete messages sent by this user (across any feedback thread)
        messageRepository.deleteBySender_Id(id);

        // 3. Delete satisfaction ratings submitted by this user as customer
        satisfactionRatingRepository.deleteByCustomer_Id(id);

        // 4. Delete survey responses submitted by this user
        surveyResponseRepository.deleteByCustomer_Id(id);

        // 5. Nullify assignedStaff on feedback where this user was staff
        feedbackRepository.unassignStaff(id);

        // 5. Delete all feedback submitted by this user as customer (with all children)
        feedbackRepository.findByCustomer_Id(id).forEach(feedback -> {
            UUID fid = feedback.getId();
            commentRepository.deleteByFeedback_Id(fid);
            historyRepository.deleteByFeedback_Id(fid);
            attachmentRepository.deleteByFeedback_Id(fid);
            ratingRepository.deleteByFeedback_Id(fid);
            satisfactionRatingRepository.deleteByFeedback_Id(fid);
            messageRepository.deleteByFeedback_Id(fid);
            feedbackRepository.delete(feedback);
        });

        // 6. Delete password reset tokens and OTPs
        passwordResetTokenRepository.deleteByUser_Id(id);
        loginOtpRepository.deleteByUser_Id(id);

        // 7. Delete the user
        userRepository.delete(u);
    }
}
