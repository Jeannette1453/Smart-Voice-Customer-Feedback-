package rw.smartvoice.dto;

import rw.smartvoice.model.User;

import java.time.Instant;
import java.util.UUID;

public class ProfileResponse {
    public UUID id;
    public String fullName;
    public String email;
    public String phone;
    public String role;
    public boolean enabled;
    public Instant createdAt;

    public static ProfileResponse from(User u) {
        ProfileResponse r = new ProfileResponse();
        r.id = u.getId();
        r.fullName = u.getFullName();
        r.email = u.getEmail();
        r.phone = u.getPhone();
        r.role = u.getRole().name();
        r.enabled = u.isEnabled();
        r.createdAt = u.getCreatedAt();
        return r;
    }
}