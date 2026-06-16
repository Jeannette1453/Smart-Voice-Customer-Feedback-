package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.SystemSettingRequest;
import rw.smartvoice.dto.SystemSettingResponse;
import rw.smartvoice.service.SystemSettingService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/settings")
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    public SystemSettingController(SystemSettingService systemSettingService) {
        this.systemSettingService = systemSettingService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<SystemSettingResponse>> all() {
        return ResponseEntity.ok(systemSettingService.all());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SystemSettingResponse> save(@Valid @RequestBody SystemSettingRequest req) {
        return ResponseEntity.ok(systemSettingService.save(req));
    }
}