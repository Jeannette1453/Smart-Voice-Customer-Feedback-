package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import rw.smartvoice.model.QuestionType;

import java.util.List;

public class CreateSurveyRequest {
    @NotBlank public String title;
    public String description;
    public boolean active = true;

    @NotNull public List<QuestionItem> questions;

    public static class QuestionItem {
        @NotBlank public String questionText;
        @NotNull public QuestionType type;
        public List<String> options; // for MULTIPLE_CHOICE
        public int orderIndex;
    }
}
