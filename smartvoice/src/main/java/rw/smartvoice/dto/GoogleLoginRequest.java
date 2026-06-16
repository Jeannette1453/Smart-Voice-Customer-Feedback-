package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {
    @NotBlank
    public String idToken;
}
