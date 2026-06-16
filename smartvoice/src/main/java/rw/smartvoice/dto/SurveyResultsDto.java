package rw.smartvoice.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class SurveyResultsDto {
    public UUID surveyId;
    public String title;
    public long totalResponses;

    // key: questionText, value: map answer->count
    public List<QuestionResult> questions;

    public static class QuestionResult {
        public UUID questionId;
        public String questionText;
        public Map<String, Long> counts;
    }
}
