package rw.smartvoice.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateSurveyActiveRequest {
    @NotNull
    public Boolean active;
}