package rw.smartvoice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CreateRatingRequest {

    @NotNull
    @Min(1)
    @Max(5)
    public Integer stars;

    public String comment;
}