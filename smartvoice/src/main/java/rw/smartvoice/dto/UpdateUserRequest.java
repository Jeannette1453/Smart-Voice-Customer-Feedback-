package rw.smartvoice.dto;

import rw.smartvoice.model.Role;

public class UpdateUserRequest {
    public String fullName;
    public Role role;
    public Boolean enabled;
    public String phone;
    public java.util.UUID departmentId;
    public String password;
}
