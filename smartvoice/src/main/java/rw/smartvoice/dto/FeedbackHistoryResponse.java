package rw.smartvoice.dto;

import rw.smartvoice.model.FeedbackHistory;

import java.time.Instant;
import java.util.UUID;

public class FeedbackHistoryResponse {
    public UUID id;
    public String fromStatus;
    public String toStatus;
    public String actorEmail;
    public String note;
    public Instant createdAt;

    public static FeedbackHistoryResponse fromEntity(FeedbackHistory h) {
        FeedbackHistoryResponse d = new FeedbackHistoryResponse();
        d.id = h.getId();
        d.fromStatus = h.getFromStatus() != null ? h.getFromStatus().name() : null;
        d.toStatus = h.getToStatus() != null ? h.getToStatus().name() : null;
        d.actorEmail = h.getActorEmail();
        d.note = h.getNote();
        d.createdAt = h.getCreatedAt();
        return d;
    }
}
