package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.smartvoice.dto.NotificationResponse;
import rw.smartvoice.model.Notification;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.NotificationRepository;
import rw.smartvoice.repository.UserRepository;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public List<NotificationResponse> my(UUID userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    public long unreadCount(UUID userId) {
        return notificationRepository.countByUser_IdAndReadFalse(userId);
    }

    public NotificationResponse markRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!n.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot modify this notification");
        }

        n.setRead(true);
        return NotificationResponse.from(notificationRepository.save(n));
    }

    public int markAllRead(UUID userId) {
        return notificationRepository.markAllRead(userId);
    }

    public void createNotification(UUID userId,
                                   String title,
                                   String message,
                                   String senderName,
                                   String senderEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setRead(false);
        n.setSenderName(senderName);
        n.setSenderEmail(senderEmail);

        notificationRepository.save(n);
    }
}
