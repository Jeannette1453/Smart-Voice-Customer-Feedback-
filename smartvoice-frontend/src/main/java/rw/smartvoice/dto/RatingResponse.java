package rw.smartvoice.dto;

import rw.smartvoice.model.SatisfactionRating;

import java.time.Instant;
import java.util.UUID;

public class RatingResponse {
    public UUID id;
    public UUID feedbackId;
    public UUID customerId;
    public String customerEmail;
    public int stars;
    public String comment;
    public Instant createdAt;

    public static RatingResponse fromEntity(SatisfactionRating r) {
        RatingResponse res = new RatingResponse();
        res.id = r.getId();
        res.feedbackId = r.getFeedback().getId();
        res.customerId = r.getCustomer().getId();
        res.customerEmail = r.getCustomer().getEmail();
        res.stars = r.getStars();
        res.comment = r.getComment();
        res.createdAt = r.getCreatedAt();
        return res;
    }
}