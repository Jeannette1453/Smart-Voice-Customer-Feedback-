package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class AddCommentRequest {
    @NotBlank public String message;
}
