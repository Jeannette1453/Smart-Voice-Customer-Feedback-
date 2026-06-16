package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class DepartmentRequest {
    @NotBlank public String name;
}
