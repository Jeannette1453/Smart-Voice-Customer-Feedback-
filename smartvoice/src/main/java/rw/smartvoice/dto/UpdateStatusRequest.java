package rw.smartvoice.dto;

import jakarta.validation.constraints.NotNull;
import rw.smartvoice.model.FeedbackStatus;

public class UpdateStatusRequest {
    @NotNull public FeedbackStatus status;
    public String note; // optional
}
