package rw.smartvoice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import rw.smartvoice.model.Role;

public class CreateUserRequest {
    @NotBlank public String fullName;
    @Email @NotBlank public String email;
    @NotBlank public String password;
    @NotNull public Role role; // STAFF, MANAGER, ADMIN, CUSTOMER
}
