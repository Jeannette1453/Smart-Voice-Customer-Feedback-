package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import rw.smartvoice.model.FeedbackType;
import rw.smartvoice.model.Priority;

public class CreateFeedbackRequest {
    @NotNull public FeedbackType type;
    @NotBlank public String category;
    public String subCategory;
    @NotNull public Priority priority;
    @NotBlank public String message;
}
