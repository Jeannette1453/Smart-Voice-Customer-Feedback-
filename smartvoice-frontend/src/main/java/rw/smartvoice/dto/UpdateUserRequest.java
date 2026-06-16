package rw.smartvoice.dto;

import rw.smartvoice.model.Role;

public class UpdateUserRequest {
    public String fullName;
    public Role role;
    public Boolean enabled;

    // ✅ optional: allow admin to reset password
    public String password;
}
