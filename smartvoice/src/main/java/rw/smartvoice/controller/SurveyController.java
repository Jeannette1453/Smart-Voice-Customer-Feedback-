package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.*;
import rw.smartvoice.repository.UserRepository;
import rw.smartvoice.service.SurveyService;
import rw.smartvoice.util.SecurityUtil;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {

    private final SurveyService surveyService;
    private final UserRepository userRepository;

    public SurveyController(SurveyService surveyService, UserRepository userRepository) {
        this.surveyService = surveyService;
        this.userRepository = userRepository;
    }

    private UUID currentUserId() {
        String email = SecurityUtil.currentEmail();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    // ✅ CUSTOMER: list active surveys only
    @PreAuthorize("hasRole('CUSTOMER')")
    @GetMapping("/active")
    public ResponseEntity<List<SurveyResponseDto>> active() {
        return ResponseEntity.ok(surveyService.listActive());
    }
    // MANAGER/ADMIN: activate/deactivate survey
@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
@PatchMapping("/{id}/active")
public ResponseEntity<SurveyResponseDto> setActive(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateSurveyActiveRequest req
) {
    return ResponseEntity.ok(surveyService.setActive(id, req.active));
}

    // ✅ STAFF/MANAGER/ADMIN: list all surveys
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN')")
    @GetMapping
    public ResponseEntity<List<SurveyResponseDto>> all() {
        return ResponseEntity.ok(surveyService.listAll());
    }

    // ✅ STAFF/MANAGER/ADMIN: view survey details + questions (preview)
    @PreAuthorize("hasAnyRole('STAFF','MANAGER','ADMIN','CUSTOMER')")
    @GetMapping("/{id}")
    public ResponseEntity<SurveyResponseDto> get(@PathVariable UUID id) {
        return ResponseEntity.ok(surveyService.getSurvey(id));
    }

    // ✅ MANAGER/ADMIN: create survey
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @PostMapping
    public ResponseEntity<SurveyResponseDto> create(@Valid @RequestBody CreateSurveyRequest req) {
        return ResponseEntity.status(201).body(surveyService.createSurvey(currentUserId(), req));
    }

    // ✅ CUSTOMER: submit survey answers
    @PreAuthorize("hasRole('CUSTOMER')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<Void> submit(@PathVariable UUID id, @Valid @RequestBody SubmitSurveyRequest req) {
        surveyService.submit(currentUserId(), id, req);
        return ResponseEntity.noContent().build();
    }

    // ✅ MANAGER/ADMIN: results
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping("/{id}/results")
    public ResponseEntity<SurveyResultsDto> results(@PathVariable UUID id) {
        return ResponseEntity.ok(surveyService.results(id));
    }
}
