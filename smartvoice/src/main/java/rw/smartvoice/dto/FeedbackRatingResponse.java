package rw.smartvoice.dto;

import rw.smartvoice.model.FeedbackRating;

import java.time.Instant;
import java.util.UUID;

public class FeedbackRatingResponse {

    public UUID id;
    public UUID feedbackId;
    public int rating;
    public String comment;
    public Instant createdAt;

    public static FeedbackRatingResponse fromEntity(FeedbackRating r) {
        FeedbackRatingResponse d = new FeedbackRatingResponse();
        d.id = r.getId();
        d.feedbackId = r.getFeedback() != null ? r.getFeedback().getId() : null;
        d.rating = r.getRating();
        d.comment = r.getComment();
        d.createdAt = r.getCreatedAt();
        return d;
    }
}