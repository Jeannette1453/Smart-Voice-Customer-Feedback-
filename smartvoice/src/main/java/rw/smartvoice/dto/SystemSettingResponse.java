package rw.smartvoice.dto;

import rw.smartvoice.model.SystemSetting;

import java.util.UUID;

public class SystemSettingResponse {
    public UUID id;
    public String settingKey;
    public String settingValue;

    public static SystemSettingResponse from(SystemSetting s) {
        SystemSettingResponse r = new SystemSettingResponse();
        r.id = s.getId();
        r.settingKey = s.getSettingKey();
        r.settingValue = s.getSettingValue();
        return r;
    }
}