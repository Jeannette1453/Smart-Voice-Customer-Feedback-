package rw.smartvoice.dto;

import jakarta.validation.constraints.NotBlank;

public class SystemSettingRequest {
    @NotBlank
    public String settingKey;

    @NotBlank
    public String settingValue;
}