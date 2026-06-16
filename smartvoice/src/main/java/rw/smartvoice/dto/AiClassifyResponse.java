package rw.smartvoice.dto;

public class AiClassifyResponse {
    public String predictedCategory;
    public String sentiment;  // POSITIVE/NEUTRAL/NEGATIVE
    public String urgency;    // LOW/MEDIUM/HIGH/URGENT
}
