package rw.smartvoice.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "survey_questions")
public class SurveyQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    // ✅ IMPORTANT: your DB column is "text"
    @Column(name = "text", nullable = false, length = 1000)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Column(name = "options_text", length = 2000)
    private String optionsText;

    @Column(name = "order_index", nullable = false)
    private int orderIndex = 0;

    // getters/setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Survey getSurvey() { return survey; }
    public void setSurvey(Survey survey) { this.survey = survey; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public QuestionType getType() { return type; }
    public void setType(QuestionType type) { this.type = type; }

    public String getOptionsText() { return optionsText; }
    public void setOptionsText(String optionsText) { this.optionsText = optionsText; }

    public int getOrderIndex() { return orderIndex; }
    public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }
}
