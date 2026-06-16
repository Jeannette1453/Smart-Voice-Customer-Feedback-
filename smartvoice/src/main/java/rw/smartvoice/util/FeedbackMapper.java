package rw.smartvoice.util;

import rw.smartvoice.dto.FeedbackResponse;
import rw.smartvoice.model.Feedback;

public class FeedbackMapper {

    public static FeedbackResponse toDto(Feedback f) {
        FeedbackResponse d = new FeedbackResponse();

        d.id = f.getId();
        d.type = f.getType();
        d.category = f.getCategory();
        d.subCategory = f.getSubCategory();
        d.priority = f.getPriority();
        d.message = f.getMessage();
        d.status = f.getStatus();
        d.escalated = f.isEscalated();

        if (f.getCustomer() != null) {
            d.customerId = f.getCustomer().getId();
            d.customerEmail = f.getCustomer().getEmail();
        }

        if (f.getAssignedDepartment() != null) {
            d.departmentId = f.getAssignedDepartment().getId();
            d.departmentName = f.getAssignedDepartment().getName();
        }

        if (f.getAssignedStaff() != null) {
            d.assignedStaffId = f.getAssignedStaff().getId();
            d.assignedStaffEmail = f.getAssignedStaff().getEmail();
        }

        d.createdAt = f.getCreatedAt();
        d.updatedAt = f.getUpdatedAt();

        return d;
    }
}
