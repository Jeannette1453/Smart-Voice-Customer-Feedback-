package rw.smartvoice.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feedback_comments")
public class FeedbackComment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_id", nullable = false)
    private Feedback feedback;

    @Column(columnDefinition = "text", nullable = false)
    private String message;

    private String authorEmail;

    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }

    public Feedback getFeedback() { return feedback; }
    public void setFeedback(Feedback feedback) { this.feedback = feedback; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getAuthorEmail() { return authorEmail; }
    public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }

    public Instant getCreatedAt() { return createdAt; }
}
