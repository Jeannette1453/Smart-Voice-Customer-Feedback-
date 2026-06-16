package rw.smartvoice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import rw.smartvoice.model.Role;

public class RegisterRequest {

    @NotBlank
    public String fullName;

    @Email
    @NotBlank
    public String email;

    @NotBlank
    public String password;

    // ✅ allow role to be sent (ADMIN, CUSTOMER, STAFF, etc.)
    public Role role;
}
