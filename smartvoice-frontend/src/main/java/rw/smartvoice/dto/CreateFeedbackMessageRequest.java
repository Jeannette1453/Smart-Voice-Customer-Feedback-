package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateFeedbackMessageRequest {
    @NotBlank
    public String message;
}
