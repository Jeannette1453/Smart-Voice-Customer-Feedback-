package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.FeedbackComment;
import rw.smartvoice.repository.FeedbackCommentRepository;
import rw.smartvoice.repository.FeedbackRepository;

import java.util.List;
import java.util.UUID;

@Service
public class CommentService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackCommentRepository commentRepository;

    public CommentService(FeedbackRepository feedbackRepository, FeedbackCommentRepository commentRepository) {
        this.feedbackRepository = feedbackRepository;
        this.commentRepository = commentRepository;
    }

    public FeedbackComment add(UUID feedbackId, String message, String authorEmail) {
        Feedback f = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        FeedbackComment c = new FeedbackComment();
        c.setFeedback(f);
        c.setMessage(message);
        c.setAuthorEmail(authorEmail);
        return commentRepository.save(c);
    }

    public List<FeedbackComment> list(UUID feedbackId) {
        return commentRepository.findByFeedback_IdOrderByCreatedAtAsc(feedbackId);
    }
}
