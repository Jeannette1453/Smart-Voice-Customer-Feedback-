package rw.smartvoice.dto;

import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;

import java.util.UUID;

public class UserLiteResponse {
    public UUID id;
    public String email;
    public String fullName;
    public Role role;

    public static UserLiteResponse from(User u) {
        UserLiteResponse d = new UserLiteResponse();
        d.id = u.getId();
        d.email = u.getEmail();
        d.fullName = u.getFullName();
        d.role = u.getRole();
        return d;
    }
}