package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import rw.smartvoice.model.QuestionType;

public class CreateSurveyQuestionRequest {
    @NotBlank public String text;
    @NotNull public QuestionType type;
}
