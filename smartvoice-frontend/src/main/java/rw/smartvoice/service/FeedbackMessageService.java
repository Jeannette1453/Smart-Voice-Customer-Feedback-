package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.smartvoice.dto.FeedbackMessageResponse;
import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.FeedbackMessage;
import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.FeedbackMessageRepository;
import rw.smartvoice.repository.FeedbackRepository;
import rw.smartvoice.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FeedbackMessageService {

    private final FeedbackMessageRepository feedbackMessageRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public FeedbackMessageService(FeedbackMessageRepository feedbackMessageRepository,
                                  FeedbackRepository feedbackRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService,
                                  EmailService emailService) {
        this.feedbackMessageRepository = feedbackMessageRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    public List<FeedbackMessageResponse> getMessages(UUID feedbackId) {
        return feedbackMessageRepository.findByFeedbackId(feedbackId)
                .stream()
                .map(FeedbackMessageResponse::fromEntity)
                .toList();
    }

    public FeedbackMessageResponse sendMessage(UUID feedbackId, UUID senderId, String text) {
        Feedback feedback = feedbackRepository.findByIdWithJoins(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));

        // CUSTOMER can only message on own feedback
        if (sender.getRole() == Role.CUSTOMER) {
            if (feedback.getCustomer() == null || !feedback.getCustomer().getId().equals(senderId)) {
                throw new IllegalArgumentException("You can only message on your own feedback");
            }
        }

        // STAFF can only message on assigned feedback
        if (sender.getRole() == Role.STAFF) {
            if (feedback.getAssignedStaff() == null || !feedback.getAssignedStaff().getId().equals(senderId)) {
                throw new IllegalArgumentException("You can only message on feedback assigned to you");
            }
        }

        FeedbackMessage m = new FeedbackMessage();
        m.setFeedback(feedback);
        m.setSender(sender);
        m.setMessage(text.trim());

        FeedbackMessage saved = feedbackMessageRepository.save(m);

        // notify the opposite side
        try {
            if (sender.getRole() == Role.CUSTOMER) {
                if (feedback.getAssignedStaff() != null) {
                    notificationService.createNotification(
                            feedback.getAssignedStaff().getId(),
                            "New customer reply",
                            sender.getFullName() + " (" + sender.getEmail() + ") replied on feedback \"" + feedback.getCategory() + "\".",
                            sender.getFullName(),
                            sender.getEmail()
                    );

                    if (feedback.getAssignedStaff().getEmail() != null) {
                        emailService.sendSimpleEmail(
                                feedback.getAssignedStaff().getEmail(),
                                "SmartVoice Customer Reply",
                                "Customer " + sender.getFullName() + " replied on feedback \"" + feedback.getCategory() + "\".\n\nMessage:\n" + text
                        );
                    }
                }
            } else {
                if (feedback.getCustomer() != null) {
                    notificationService.createNotification(
                            feedback.getCustomer().getId(),
                            "New staff update",
                            sender.getFullName() + " replied to your feedback \"" + feedback.getCategory() + "\".",
                            sender.getFullName(),
                            sender.getEmail()
                    );

                    if (feedback.getCustomer().getEmail() != null) {
                        emailService.sendSimpleEmail(
                                feedback.getCustomer().getEmail(),
                                "SmartVoice Feedback Reply",
                                "Hello " + feedback.getCustomer().getFullName() + ",\n\n"
                                        + sender.getFullName() + " replied to your feedback \"" + feedback.getCategory() + "\".\n\nMessage:\n" + text
                        );
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("FEEDBACK MESSAGE NOTIFICATION ERROR => " + e.getMessage());
        }

        return FeedbackMessageResponse.fromEntity(saved);
    }
}
