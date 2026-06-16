package rw.smartvoice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Enumerated(EnumType.STRING)
    private FeedbackType type;

    @NotBlank
    private String category;

    private String subCategory;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    @NotBlank
    @Column(columnDefinition = "text")
    private String message;

    @NotNull
    @Enumerated(EnumType.STRING)
    private FeedbackStatus status = FeedbackStatus.NEW;

    private boolean escalated = false;
    

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department assignedDepartment;

    @Column(length = 30)
private String aiSentiment;

@Column(length = 100)
private String aiSuggestedDepartment;

@Column(length = 500)
private String aiSummary;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = Instant.now(); }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public FeedbackType getType() { return type; }
    public void setType(FeedbackType type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public FeedbackStatus getStatus() { return status; }
    public void setStatus(FeedbackStatus status) { this.status = status; }

    public boolean isEscalated() { return escalated; }
    public void setEscalated(boolean escalated) { this.escalated = escalated; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public Department getAssignedDepartment() { return assignedDepartment; }
    public void setAssignedDepartment(Department assignedDepartment) { this.assignedDepartment = assignedDepartment; }

    public User getAssignedStaff() { return assignedStaff; }
    public void setAssignedStaff(User assignedStaff) { this.assignedStaff = assignedStaff; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getAiSentiment() {
    return aiSentiment;
}

public void setAiSentiment(String aiSentiment) {
    this.aiSentiment = aiSentiment;
}

public String getAiSuggestedDepartment() {
    return aiSuggestedDepartment;
}

public void setAiSuggestedDepartment(String aiSuggestedDepartment) {
    this.aiSuggestedDepartment = aiSuggestedDepartment;
}

public String getAiSummary() {
    return aiSummary;
}

public void setAiSummary(String aiSummary) {
    this.aiSummary = aiSummary;
}
}
