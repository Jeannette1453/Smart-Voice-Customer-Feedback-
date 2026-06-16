package rw.smartvoice.dto;

import rw.smartvoice.model.FeedbackMessage;

import java.time.Instant;
import java.util.UUID;

public class FeedbackMessageResponse {
    public UUID id;
    public String senderName;
    public String senderEmail;
    public String senderRole;
    public String message;
    public Instant createdAt;

    public static FeedbackMessageResponse fromEntity(FeedbackMessage m) {
        FeedbackMessageResponse r = new FeedbackMessageResponse();
        r.id = m.getId();
        r.senderName = m.getSender() != null ? m.getSender().getFullName() : null;
        r.senderEmail = m.getSender() != null ? m.getSender().getEmail() : null;
        r.senderRole = m.getSender() != null && m.getSender().getRole() != null
                ? m.getSender().getRole().name()
                : null;
        r.message = m.getMessage();
        r.createdAt = m.getCreatedAt();
        return r;
    }
}
