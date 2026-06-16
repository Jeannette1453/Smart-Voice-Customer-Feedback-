package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class FeedbackCategoryRequest {
    @NotBlank
    public String name;
}