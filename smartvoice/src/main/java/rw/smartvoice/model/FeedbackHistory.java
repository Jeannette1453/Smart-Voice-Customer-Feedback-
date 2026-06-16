package rw.smartvoice.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feedback_history")
public class FeedbackHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feedback_id", nullable = false)
    private Feedback feedback;

    @Enumerated(EnumType.STRING)
    private FeedbackStatus fromStatus;

    @Enumerated(EnumType.STRING)
    private FeedbackStatus toStatus;

    private String note;

    private String actorEmail; // who changed it

    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }

    public Feedback getFeedback() { return feedback; }
    public void setFeedback(Feedback feedback) { this.feedback = feedback; }

    public FeedbackStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(FeedbackStatus fromStatus) { this.fromStatus = fromStatus; }

    public FeedbackStatus getToStatus() { return toStatus; }
    public void setToStatus(FeedbackStatus toStatus) { this.toStatus = toStatus; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }

    public Instant getCreatedAt() { return createdAt; }
}
