package rw.smartvoice.dto;

import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;

import java.time.Instant;
import java.util.UUID;

public class UserResponse {
    public UUID id;
    public String fullName;
    public String email;
    public String phone;
    public Role role;
    public boolean enabled;
    public Instant createdAt;
    public UUID departmentId;
    public String departmentName;

    public static UserResponse fromEntity(User u) {
        UserResponse r = new UserResponse();
        r.id = u.getId();
        r.fullName = u.getFullName();
        r.email = u.getEmail();
        r.phone = u.getPhone();
        r.role = u.getRole();
        r.enabled = u.isEnabled();
        r.createdAt = u.getCreatedAt();
        if (u.getDepartment() != null) {
            r.departmentId = u.getDepartment().getId();
            r.departmentName = u.getDepartment().getName();
        }
        return r;
    }
}
