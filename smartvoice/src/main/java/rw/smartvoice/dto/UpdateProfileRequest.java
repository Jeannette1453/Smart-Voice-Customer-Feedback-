package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateProfileRequest {
    @NotBlank
    public String fullName;
    public String phone;
}