package rw.smartvoice.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class SubmitSurveyRequest {

    @NotNull public List<AnswerItem> answers;

    public static class AnswerItem {
        @NotNull public UUID questionId;
        public String answerText;
    }
}
