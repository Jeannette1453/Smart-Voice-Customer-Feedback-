package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.ChangePasswordRequest;
import rw.smartvoice.dto.ProfileResponse;
import rw.smartvoice.dto.UpdateProfileRequest;
import rw.smartvoice.service.ProfileService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> me() {
        return ResponseEntity.ok(profileService.me());
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> update(@Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(profileService.updateMyProfile(req));
    }

    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/change-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        profileService.changePassword(req);
        return ResponseEntity.ok("Password changed successfully");
    }
}