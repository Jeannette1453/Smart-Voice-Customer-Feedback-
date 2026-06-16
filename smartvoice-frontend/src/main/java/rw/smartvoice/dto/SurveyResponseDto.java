package rw.smartvoice.dto;

import rw.smartvoice.model.QuestionType;
import rw.smartvoice.model.Survey;
import rw.smartvoice.model.SurveyQuestion;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SurveyResponseDto {
    public UUID id;
    public String title;
    public String description;
    public boolean active;
    public Instant createdAt;
    public List<QuestionDto> questions;

    public static class QuestionDto {
        public UUID id;
        public String questionText;
        public QuestionType type;
        public List<String> options;
        public int orderIndex;
    }

    public static SurveyResponseDto fromEntity(Survey s) {
        SurveyResponseDto d = new SurveyResponseDto();
        d.id = s.getId();
        d.title = s.getTitle();
        d.description = s.getDescription();
        d.active = s.isActive();
        d.createdAt = s.getCreatedAt();

        d.questions = s.getQuestions().stream().map(q -> {
            QuestionDto qd = new QuestionDto();
            qd.id = q.getId();
            qd.questionText = q.getQuestionText();
            qd.type = q.getType();
            qd.orderIndex = q.getOrderIndex();

            if (q.getOptionsText() != null && !q.getOptionsText().isBlank()) {
                qd.options = List.of(q.getOptionsText().split("\\|"));
            } else {
                qd.options = List.of();
            }
            return qd;
        }).toList();

        return d;
    }

    public static SurveyResponseDto fromEntityNoQuestions(Survey s) {
        SurveyResponseDto d = new SurveyResponseDto();
        d.id = s.getId();
        d.title = s.getTitle();
        d.description = s.getDescription();
        d.active = s.isActive();
        d.createdAt = s.getCreatedAt();
        d.questions = List.of();
        return d;
    }
}
