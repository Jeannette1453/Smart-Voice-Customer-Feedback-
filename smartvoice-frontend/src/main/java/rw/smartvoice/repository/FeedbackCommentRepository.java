package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.smartvoice.model.FeedbackComment;

import java.util.List;
import java.util.UUID;

public interface FeedbackCommentRepository extends JpaRepository<FeedbackComment, UUID> {
    List<FeedbackComment> findByFeedback_IdOrderByCreatedAtAsc(UUID feedbackId);
}
