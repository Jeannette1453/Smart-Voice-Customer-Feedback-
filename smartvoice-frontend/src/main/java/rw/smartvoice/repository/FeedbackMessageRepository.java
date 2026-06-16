package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import rw.smartvoice.model.FeedbackMessage;

import java.util.List;
import java.util.UUID;

public interface FeedbackMessageRepository extends JpaRepository<FeedbackMessage, UUID> {

    @Query("""
        select m from FeedbackMessage m
        join fetch m.sender
        where m.feedback.id = :feedbackId
        order by m.createdAt asc
    """)
    List<FeedbackMessage> findByFeedbackId(UUID feedbackId);
}
