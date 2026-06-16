package rw.smartvoice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class FeedbackRatingRequest {

    @Min(1)
    @Max(5)
    public int rating;

    public String comment;
}