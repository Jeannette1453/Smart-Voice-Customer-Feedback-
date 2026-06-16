package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class FaqRequest {

    @NotBlank
    public String question;

    @NotBlank
    public String answer;

    public String category; // ✅ IMPORTANT
    public Boolean active;
}