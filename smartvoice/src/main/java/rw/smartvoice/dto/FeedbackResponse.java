package rw.smartvoice.dto;

import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.FeedbackStatus;
import rw.smartvoice.model.FeedbackType;
import rw.smartvoice.model.Priority;

import java.time.Instant;
import java.util.UUID;

public class FeedbackResponse {

    public UUID id;
    public FeedbackType type;
    public String category;
    public String subCategory;
    public Priority priority;
    public String message;
    public FeedbackStatus status;
    public boolean escalated;
   

    // ✅ AI fields
    public String aiSentiment;
    public String aiSuggestedDepartment;
    public String aiSummary;

    public UUID customerId;
    public String customerEmail;
    public String customerName;
    public String customerPhone;

    public UUID departmentId;
    public String departmentName;

    public UUID assignedStaffId;
    public String assignedStaffEmail;
    public String assignedStaffName;

    public Instant createdAt;
    public Instant updatedAt;

    public static FeedbackResponse fromEntity(Feedback f) {
        FeedbackResponse d = new FeedbackResponse();

        d.id = f.getId();
        d.type = f.getType();
        d.category = f.getCategory();
        d.subCategory = f.getSubCategory();
        d.priority = f.getPriority();
        d.message = f.getMessage();
        d.status = f.getStatus();
        d.escalated = f.isEscalated();
        

        // ✅ AI values
        d.aiSentiment = f.getAiSentiment();
        d.aiSuggestedDepartment = f.getAiSuggestedDepartment();
        d.aiSummary = f.getAiSummary();

        if (f.getCustomer() != null) {
            d.customerId = f.getCustomer().getId();
            d.customerEmail = f.getCustomer().getEmail();
            d.customerName = f.getCustomer().getFullName();
            d.customerPhone = f.getCustomer().getPhone();
        }

        if (f.getAssignedDepartment() != null) {
            d.departmentId = f.getAssignedDepartment().getId();
            d.departmentName = f.getAssignedDepartment().getName();
        }

        if (f.getAssignedStaff() != null) {
            d.assignedStaffId = f.getAssignedStaff().getId();
            d.assignedStaffEmail = f.getAssignedStaff().getEmail();
            d.assignedStaffName = f.getAssignedStaff().getFullName();
        }

        d.createdAt = f.getCreatedAt();
        d.updatedAt = f.getUpdatedAt();

        return d;
    }
}