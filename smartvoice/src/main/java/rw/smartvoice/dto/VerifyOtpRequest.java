package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyOtpRequest {
    @NotBlank
    public String email;
    @NotBlank
    public String code;
}
