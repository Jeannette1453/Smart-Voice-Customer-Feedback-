package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class OutreachRequest {
    public UUID customerId;
    @NotBlank
    public String subject;
    @NotBlank
    public String message;
}
