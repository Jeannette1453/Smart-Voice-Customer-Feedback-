package rw.smartvoice.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "survey_answers")
public class SurveyAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    private SurveyResponse response;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private SurveyQuestion question;

    @Column(length = 2000)
    private String answerText;

    // getters/setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public SurveyResponse getResponse() { return response; }
    public void setResponse(SurveyResponse response) { this.response = response; }

    public SurveyQuestion getQuestion() { return question; }
    public void setQuestion(SurveyQuestion question) { this.question = question; }

    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }
}
