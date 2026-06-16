package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rw.smartvoice.model.FeedbackHistory;

import java.util.List;
import java.util.UUID;

public interface FeedbackHistoryRepository extends JpaRepository<FeedbackHistory, UUID> {

    @Query("""
        select h from FeedbackHistory h
        join fetch h.feedback f
        where f.id = :feedbackId
        order by h.createdAt desc
    """)
    List<FeedbackHistory> findTimeline(@Param("feedbackId") UUID feedbackId);
    
    List<FeedbackHistory> findByFeedback_IdOrderByCreatedAtDesc(UUID feedbackId);

    void deleteByFeedback_Id(UUID feedbackId);
}