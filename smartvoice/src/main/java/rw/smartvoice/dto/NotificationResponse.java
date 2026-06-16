package rw.smartvoice.dto;

import rw.smartvoice.model.Notification;

import java.time.Instant;
import java.util.UUID;

public class NotificationResponse {
    public UUID id;
    public String title;
    public String message;
    public boolean read;
    public Instant createdAt;

    public String senderName;
    public String senderEmail;

    public static NotificationResponse from(Notification n) {
        NotificationResponse d = new NotificationResponse();
        d.id = n.getId();
        d.title = n.getTitle();
        d.message = n.getMessage();
        d.read = n.isRead();
        d.createdAt = n.getCreatedAt();
        d.senderName = n.getSenderName();
        d.senderEmail = n.getSenderEmail();
        return d;
    }
}
