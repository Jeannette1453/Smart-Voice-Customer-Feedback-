package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.smartvoice.dto.SystemSettingRequest;
import rw.smartvoice.dto.SystemSettingResponse;
import rw.smartvoice.model.SystemSetting;
import rw.smartvoice.repository.SystemSettingRepository;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class SystemSettingService {

    private final SystemSettingRepository systemSettingRepository;

    public SystemSettingService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    public List<SystemSettingResponse> all() {
        return systemSettingRepository.findAll()
                .stream()
                .map(SystemSettingResponse::from)
                .toList();
    }

    public SystemSettingResponse save(SystemSettingRequest req) {
        SystemSetting s = systemSettingRepository.findBySettingKey(req.settingKey.trim())
                .orElseGet(SystemSetting::new);

        s.setSettingKey(req.settingKey.trim());
        s.setSettingValue(req.settingValue.trim());

        return SystemSettingResponse.from(systemSettingRepository.save(s));
    }

    public String getValue(String key, String defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    public int getIntValue(String key, int defaultValue) {
        try {
            return Integer.parseInt(getValue(key, String.valueOf(defaultValue)).trim());
        } catch (Exception e) {
            return defaultValue;
        }
    }

    public String renderTemplate(String key, String defaultTemplate, Map<String, String> values) {
        String template = getValue(key, defaultTemplate);

        for (Map.Entry<String, String> entry : values.entrySet()) {
            String placeholder = "{" + entry.getKey() + "}";
            String value = entry.getValue() == null ? "" : entry.getValue();
            template = template.replace(placeholder, value);
        }

        return template;
    }
}