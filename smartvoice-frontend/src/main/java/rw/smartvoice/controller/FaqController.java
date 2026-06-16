package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.FaqRequest;
import rw.smartvoice.dto.FaqResponse;
import rw.smartvoice.service.FaqService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/faqs")
public class FaqController {

    private final FaqService faqService;

    public FaqController(FaqService faqService) {
        this.faqService = faqService;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/active")
    public ResponseEntity<List<FaqResponse>> active() {
        return ResponseEntity.ok(faqService.active());
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @GetMapping
    public ResponseEntity<List<FaqResponse>> all() {
        return ResponseEntity.ok(faqService.all());
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @PostMapping
    public ResponseEntity<FaqResponse> create(@Valid @RequestBody FaqRequest req) {
        return ResponseEntity.status(201).body(faqService.create(req));
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<FaqResponse> update(@PathVariable UUID id, @RequestBody FaqRequest req) {
        return ResponseEntity.ok(faqService.update(id, req));
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @PatchMapping("/{id}/active")
    public ResponseEntity<FaqResponse> setActive(@PathVariable UUID id, @RequestParam boolean value) {
        return ResponseEntity.ok(faqService.setActive(id, value));
    }

    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        faqService.delete(id);
        return ResponseEntity.noContent().build();
    }
}