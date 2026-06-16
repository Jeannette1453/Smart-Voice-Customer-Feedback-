package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.smartvoice.model.SystemSetting;

import java.util.Optional;
import java.util.UUID;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, UUID> {
    Optional<SystemSetting> findBySettingKey(String settingKey);
}