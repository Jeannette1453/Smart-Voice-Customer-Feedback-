package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.smartvoice.dto.FeedbackRatingRequest;
import rw.smartvoice.dto.FeedbackRatingResponse;
import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.FeedbackRating;
import rw.smartvoice.repository.FeedbackRatingRepository;
import rw.smartvoice.repository.FeedbackRepository;

import java.util.UUID;

@Service
@Transactional
public class FeedbackRatingService {

    private final FeedbackRatingRepository feedbackRatingRepository;
    private final FeedbackRepository feedbackRepository;

    public FeedbackRatingService(FeedbackRatingRepository feedbackRatingRepository,
                                 FeedbackRepository feedbackRepository) {
        this.feedbackRatingRepository = feedbackRatingRepository;
        this.feedbackRepository = feedbackRepository;
    }

    public FeedbackRatingResponse save(UUID feedbackId, FeedbackRatingRequest req) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        FeedbackRating rating = feedbackRatingRepository.findByFeedback_Id(feedbackId)
                .orElseGet(FeedbackRating::new);

        rating.setFeedback(feedback);
        rating.setRating(req.rating);
        rating.setComment(req.comment);

        FeedbackRating saved = feedbackRatingRepository.save(rating);
        return FeedbackRatingResponse.fromEntity(saved);
    }

    public FeedbackRatingResponse getByFeedback(UUID feedbackId) {
        FeedbackRating rating = feedbackRatingRepository.findByFeedback_Id(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Rating not found"));

        return FeedbackRatingResponse.fromEntity(rating);
    }
}
