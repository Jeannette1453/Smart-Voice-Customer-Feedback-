package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rw.smartvoice.model.SatisfactionRating;

import java.util.Optional;
import java.util.UUID;

public interface SatisfactionRatingRepository extends JpaRepository<SatisfactionRating, UUID> {

    boolean existsByFeedback_Id(UUID feedbackId);

    // ✅ fetch joins to avoid LazyInitializationException
    @Query("""
        select r from SatisfactionRating r
        join fetch r.customer
        join fetch r.feedback
        where r.feedback.id = :feedbackId
    """)
    Optional<SatisfactionRating> findByFeedbackIdWithJoins(@Param("feedbackId") UUID feedbackId);
}