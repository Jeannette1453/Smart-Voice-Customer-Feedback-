package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import rw.smartvoice.dto.CreateRatingRequest;
import rw.smartvoice.dto.RatingResponse;
import rw.smartvoice.model.*;
import rw.smartvoice.repository.FeedbackRepository;
import rw.smartvoice.repository.SatisfactionRatingRepository;
import rw.smartvoice.repository.UserRepository;

import java.util.UUID;

@Service
public class SatisfactionRatingService {

    private final SatisfactionRatingRepository ratingRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    public SatisfactionRatingService(SatisfactionRatingRepository ratingRepository,
                                     FeedbackRepository feedbackRepository,
                                     UserRepository userRepository) {
        this.ratingRepository = ratingRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
    }

    private User userByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Feedback feedback(UUID feedbackId) {
        return feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));
    }

    // ✅ CUSTOMER creates rating after feedback is RESOLVED
    public RatingResponse create(UUID feedbackId, CreateRatingRequest req, String actorEmail) {
        User actor = userByEmail(actorEmail);

        if (actor.getRole() != Role.CUSTOMER) {
            throw new IllegalArgumentException("Only CUSTOMER can rate");
        }

        Feedback f = feedback(feedbackId);

        // ✅ must be your own feedback
        if (!f.getCustomer().getId().equals(actor.getId())) {
            throw new IllegalArgumentException("Not allowed (not your feedback)");
        }

        // ✅ must be resolved
        if (f.getStatus() != FeedbackStatus.RESOLVED) {
            throw new IllegalArgumentException("You can rate only when status is RESOLVED");
        }

        // ✅ only one rating per feedback
        if (ratingRepository.existsByFeedback_Id(feedbackId)) {
            throw new IllegalArgumentException("You already rated this feedback");
        }

        SatisfactionRating r = new SatisfactionRating();
        r.setFeedback(f);
        r.setCustomer(actor);
        r.setStars(req.stars);
        r.setComment(req.comment);

        return RatingResponse.fromEntity(ratingRepository.save(r));
    }

    // ✅ GET rating (CUSTOMER only for own; STAFF/MANAGER/ADMIN for all)
    public RatingResponse getForFeedback(UUID feedbackId, String actorEmail) {
        User actor = userByEmail(actorEmail);
        Feedback f = feedback(feedbackId);

        // CUSTOMER can only view rating for own feedback
        if (actor.getRole() == Role.CUSTOMER && !f.getCustomer().getId().equals(actor.getId())) {
            throw new IllegalArgumentException("Not allowed");
        }

        // ✅ use JOIN FETCH repository method to avoid lazy proxy error
        return ratingRepository.findByFeedbackIdWithJoins(feedbackId)
                .map(RatingResponse::fromEntity)
                .orElse(null);
    }
}