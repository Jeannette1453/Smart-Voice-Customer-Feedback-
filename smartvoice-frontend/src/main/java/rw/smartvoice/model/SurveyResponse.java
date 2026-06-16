package rw.smartvoice.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "survey_responses",
       uniqueConstraints = @UniqueConstraint(name="uk_survey_customer", columnNames = {"survey_id","customer_id"}))
public class SurveyResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(nullable = false, updatable = false)
    private Instant submittedAt = Instant.now();

    @OneToMany(mappedBy = "response", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SurveyAnswer> answers = new ArrayList<>();

    // getters/setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Survey getSurvey() { return survey; }
    public void setSurvey(Survey survey) { this.survey = survey; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public Instant getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(Instant submittedAt) { this.submittedAt = submittedAt; }

    public List<SurveyAnswer> getAnswers() { return answers; }
    public void setAnswers(List<SurveyAnswer> answers) { this.answers = answers; }
}
