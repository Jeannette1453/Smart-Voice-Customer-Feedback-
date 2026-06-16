package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import rw.smartvoice.model.FeedbackRating;

import java.util.Optional;
import java.util.UUID;

public interface FeedbackRatingRepository extends JpaRepository<FeedbackRating, UUID> {

    Optional<FeedbackRating> findByFeedback_Id(UUID feedbackId);

    @Query("select coalesce(avg(fr.rating), 0) from FeedbackRating fr")
    Double averageRatingValue();

    void deleteByFeedback_Id(UUID feedbackId);
}