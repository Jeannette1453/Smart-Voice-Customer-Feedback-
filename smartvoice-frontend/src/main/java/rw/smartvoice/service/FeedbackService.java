package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.smartvoice.dto.AiAnalyzeResponse;
import rw.smartvoice.dto.AssignFeedbackRequest;
import rw.smartvoice.dto.CreateFeedbackRequest;
import rw.smartvoice.dto.FeedbackResponse;
import rw.smartvoice.model.Department;
import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.FeedbackHistory;
import rw.smartvoice.model.FeedbackStatus;
import rw.smartvoice.model.FeedbackType;
import rw.smartvoice.model.Priority;
import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.DepartmentRepository;
import rw.smartvoice.repository.FeedbackHistoryRepository;
import rw.smartvoice.repository.FeedbackRepository;
import rw.smartvoice.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final FeedbackHistoryRepository feedbackHistoryRepository;
    private final AiRoutingService aiRoutingService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final SystemSettingService systemSettingService;

    public FeedbackService(FeedbackRepository feedbackRepository,
                           UserRepository userRepository,
                           DepartmentRepository departmentRepository,
                           FeedbackHistoryRepository feedbackHistoryRepository,
                           AiRoutingService aiRoutingService,
                           EmailService emailService,
                           NotificationService notificationService,
                           SystemSettingService systemSettingService) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.feedbackHistoryRepository = feedbackHistoryRepository;
        this.aiRoutingService = aiRoutingService;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.systemSettingService = systemSettingService;
    }

    public FeedbackResponse createFeedback(UUID customerId, CreateFeedbackRequest req) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Feedback f = new Feedback();
        f.setCustomer(customer);
        f.setType(req.type);
        f.setCategory(req.category);
        f.setSubCategory(req.subCategory);
        f.setPriority(req.priority);
        f.setMessage(req.message);
        f.setStatus(FeedbackStatus.NEW);

        try {
            String keywordsRaw = systemSettingService.getValue(
                    "urgent_keywords",
                    "fraud,lost money,harassment,security,threat"
            );

            String fullText = ((req.category == null ? "" : req.category) + " "
                    + (req.subCategory == null ? "" : req.subCategory) + " "
                    + (req.message == null ? "" : req.message)).toLowerCase();

            for (String kw : keywordsRaw.split(",")) {
                String keyword = kw.trim().toLowerCase();
                if (!keyword.isBlank() && fullText.contains(keyword)) {
                    f.setPriority(Priority.URGENT);
                    f.setEscalated(true);
                    break;
                }
            }
        } catch (Exception e) {
            System.out.println("URGENT KEYWORD CHECK ERROR => " + e.getMessage());
        }

        if (f.getPriority() == Priority.URGENT) {
            f.setEscalated(true);
        }

        try {
            AiAnalyzeResponse ai = aiRoutingService.analyze(req.message, req.category, req.subCategory);

            if (ai != null) {
                if (ai.priority != null && !ai.priority.isBlank()) {
                    try {
                        Priority p = Priority.valueOf(ai.priority.trim().toUpperCase());
                        f.setPriority(p);
                        if (p == Priority.URGENT) {
                            f.setEscalated(true);
                        }
                    } catch (Exception e) {
                        System.out.println("AI PRIORITY PARSE ERROR => " + e.getMessage());
                    }
                }

                if (ai.feedbackType != null && !ai.feedbackType.isBlank()) {
                    try {
                        FeedbackType ft = FeedbackType.valueOf(ai.feedbackType.trim().toUpperCase());
                        f.setType(ft);
                    } catch (Exception e) {
                        System.out.println("AI TYPE PARSE ERROR => " + e.getMessage());
                    }
                }

                if (ai.sentiment != null) {
                    f.setAiSentiment(ai.sentiment);
                }
                if (ai.suggestedDepartment != null) {
                    f.setAiSuggestedDepartment(ai.suggestedDepartment);
                }
                if (ai.summary != null) {
                    f.setAiSummary(ai.summary);
                }

                if (ai.suggestedDepartment != null && !ai.suggestedDepartment.isBlank()) {
                    departmentRepository.findByNameIgnoreCase(ai.suggestedDepartment.trim())
                            .ifPresent(dep -> {
                                f.setAssignedDepartment(dep);
                                if (f.getStatus() == FeedbackStatus.NEW) {
                                    f.setStatus(FeedbackStatus.ASSIGNED);
                                }
                            });
                }
            }
        } catch (Exception e) {
            System.out.println("AI ERROR => " + e.getMessage());
        }

        Feedback saved = feedbackRepository.saveAndFlush(f);

        Feedback full = feedbackRepository.findByIdWithJoins(saved.getId())
                .orElseThrow(() -> new IllegalArgumentException("Saved feedback not found"));

        try {
            String receivedMessage = systemSettingService.renderTemplate(
                    "template_feedback_received",
                    "Hello {customerName}, your feedback has been received successfully.",
                    Map.of(
                            "customerName", customer.getFullName(),
                            "category", full.getCategory(),
                            "priority", String.valueOf(full.getPriority()),
                            "status", String.valueOf(full.getStatus())
                    )
            );

            emailService.sendSimpleEmail(
                    customer.getEmail(),
                    "SmartVoice Feedback Received",
                    receivedMessage
            );
        } catch (Exception e) {
            System.out.println("FEEDBACK CUSTOMER EMAIL ERROR => " + e.getMessage());
        }

        try {
            String notifFeedbackReceived = systemSettingService.renderTemplate(
                    "template_notification_feedback_received",
                    "Your feedback about {category} was submitted successfully.",
                    Map.of(
                            "customerName", customer.getFullName(),
                            "category", full.getCategory(),
                            "priority", String.valueOf(full.getPriority()),
                            "status", String.valueOf(full.getStatus())
                    )
            );

            notificationService.createNotification(
                    customer.getId(),
                    "Feedback submitted",
                    notifFeedbackReceived,
                    "SmartVoice",
                    "noreply@smartvoice.local"
            );
        } catch (Exception e) {
            System.out.println("FEEDBACK CUSTOMER NOTIFICATION ERROR => " + e.getMessage());
        }

        try {
            List<User> managers = userRepository.findByRoleIn(List.of(Role.MANAGER, Role.ADMIN));

            for (User u : managers) {
                if (u.getEmail() != null && !u.getEmail().isBlank()) {
                    emailService.sendSimpleEmail(
                            u.getEmail(),
                            "New SmartVoice Feedback Submitted",
                            "Hello " + u.getFullName() + ",\n\n"
                                    + "A new feedback has been submitted.\n\n"
                                    + "Customer: " + customer.getFullName() + "\n"
                                    + "Email: " + customer.getEmail() + "\n"
                                    + "Type: " + full.getType() + "\n"
                                    + "Category: " + full.getCategory() + "\n"
                                    + "Priority: " + full.getPriority() + "\n"
                                    + "Status: " + full.getStatus() + "\n\n"
                                    + "Message:\n" + full.getMessage()
                    );
                }

                String managerNotif = "New feedback from " + customer.getFullName()
                        + " (" + customer.getEmail() + ") about \"" + full.getCategory() + "\".";

                notificationService.createNotification(
                        u.getId(),
                        "New feedback submitted",
                        managerNotif,
                        customer.getFullName(),
                        customer.getEmail()
                );
            }
        } catch (Exception e) {
            System.out.println("FEEDBACK MANAGER/ADMIN NOTIFICATION ERROR => " + e.getMessage());
        }

        return FeedbackResponse.fromEntity(full);
    }

    public List<FeedbackResponse> getMyFeedback(UUID customerId) {
        return feedbackRepository.findMine(customerId)
                .stream()
                .map(FeedbackResponse::fromEntity)
                .toList();
    }

    public Feedback getById(UUID id) {
        return feedbackRepository.findByIdWithJoins(id)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));
    }

    public FeedbackResponse getOne(UUID id) {
        return FeedbackResponse.fromEntity(getById(id));
    }

    public List<FeedbackResponse> getAll() {
        return feedbackRepository.findAllWithJoins()
                .stream()
                .map(FeedbackResponse::fromEntity)
                .toList();
    }

    public FeedbackResponse assign(UUID feedbackId, AssignFeedbackRequest req) {
        Feedback f = getById(feedbackId);

        if (req.departmentId != null) {
            Department d = departmentRepository.findById(req.departmentId)
                    .orElseThrow(() -> new IllegalArgumentException("Department not found"));
            f.setAssignedDepartment(d);
        }

        if (req.staffId != null) {
            User staff = userRepository.findById(req.staffId)
                    .orElseThrow(() -> new IllegalArgumentException("Staff not found"));
            f.setAssignedStaff(staff);
        }

        if (f.getStatus() == FeedbackStatus.NEW) {
            f.setStatus(FeedbackStatus.ASSIGNED);
        }

        Feedback saved = feedbackRepository.saveAndFlush(f);

        Feedback full = feedbackRepository.findByIdWithJoins(saved.getId())
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found after save"));

        try {
            if (full.getAssignedStaff() != null && full.getAssignedStaff().getEmail() != null) {
                emailService.sendSimpleEmail(
                        full.getAssignedStaff().getEmail(),
                        "SmartVoice Feedback Assigned To You",
                        "Hello " + full.getAssignedStaff().getFullName() + ",\n\n"
                                + "A feedback has been assigned to you.\n\n"
                                + "Customer: " + (full.getCustomer() != null ? full.getCustomer().getFullName() : "-") + "\n"
                                + "Category: " + full.getCategory() + "\n"
                                + "Priority: " + full.getPriority() + "\n"
                                + "Status: " + full.getStatus() + "\n"
                                + "Message: " + full.getMessage()
                );

                String notifToStaff = systemSettingService.renderTemplate(
                        "template_notification_feedback_assigned",
                        "Your feedback was assigned to {staffName} in {departmentName}.",
                        Map.of(
                                "customerName", full.getCustomer() != null ? full.getCustomer().getFullName() : "Customer",
                                "staffName", full.getAssignedStaff() != null ? full.getAssignedStaff().getFullName() : "-",
                                "departmentName", full.getAssignedDepartment() != null ? full.getAssignedDepartment().getName() : "-",
                                "status", String.valueOf(full.getStatus())
                        )
                );

                notificationService.createNotification(
                        full.getAssignedStaff().getId(),
                        "New feedback assigned to you",
                        notifToStaff,
                        full.getCustomer() != null ? full.getCustomer().getFullName() : "Customer",
                        full.getCustomer() != null ? full.getCustomer().getEmail() : "-"
                );
            }
        } catch (Exception e) {
            System.out.println("ASSIGN STAFF EMAIL/NOTIFICATION ERROR => " + e.getMessage());
        }

        try {
            if (full.getCustomer() != null && full.getCustomer().getEmail() != null) {
                String assignedMessage = systemSettingService.renderTemplate(
                        "template_feedback_assigned",
                        "Hello {customerName}, your feedback has been assigned to {staffName} in {departmentName}.",
                        Map.of(
                                "customerName", full.getCustomer().getFullName(),
                                "staffName", full.getAssignedStaff() != null ? full.getAssignedStaff().getFullName() : "-",
                                "departmentName", full.getAssignedDepartment() != null ? full.getAssignedDepartment().getName() : "-",
                                "status", String.valueOf(full.getStatus())
                        )
                );

                emailService.sendSimpleEmail(
                        full.getCustomer().getEmail(),
                        "SmartVoice Feedback Assigned",
                        assignedMessage
                );

                String notifAssigned = systemSettingService.renderTemplate(
                        "template_notification_feedback_assigned",
                        "Your feedback was assigned to {staffName} in {departmentName}.",
                        Map.of(
                                "customerName", full.getCustomer().getFullName(),
                                "staffName", full.getAssignedStaff() != null ? full.getAssignedStaff().getFullName() : "-",
                                "departmentName", full.getAssignedDepartment() != null ? full.getAssignedDepartment().getName() : "-",
                                "status", String.valueOf(full.getStatus())
                        )
                );

                notificationService.createNotification(
                        full.getCustomer().getId(),
                        "Feedback assigned",
                        notifAssigned,
                        full.getAssignedStaff() != null ? full.getAssignedStaff().getFullName() : "Staff",
                        full.getAssignedStaff() != null ? full.getAssignedStaff().getEmail() : "-"
                );
            }
        } catch (Exception e) {
            System.out.println("ASSIGN CUSTOMER EMAIL/NOTIFICATION ERROR => " + e.getMessage());
        }

        return FeedbackResponse.fromEntity(full);
    }

    public FeedbackResponse updateStatusByActor(UUID feedbackId, FeedbackStatus status, String actorEmail, String note) {
        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new IllegalArgumentException("Actor not found"));

        Feedback f = getById(feedbackId);

        if (actor.getRole() == Role.STAFF) {
            if (f.getAssignedStaff() == null || !f.getAssignedStaff().getId().equals(actor.getId())) {
                throw new IllegalArgumentException("You can only update feedback assigned to you");
            }

            if (!(status == FeedbackStatus.IN_PROGRESS || status == FeedbackStatus.RESOLVED)) {
                throw new IllegalArgumentException("Staff can only set status to IN_PROGRESS or RESOLVED");
            }
        }

        FeedbackStatus from = f.getStatus();
        f.setStatus(status);
        Feedback saved = feedbackRepository.saveAndFlush(f);

        FeedbackHistory h = new FeedbackHistory();
        h.setFeedback(saved);
        h.setFromStatus(from);
        h.setToStatus(status);
        h.setActorEmail(actorEmail);
        h.setNote(note);
        feedbackHistoryRepository.save(h);

        Feedback full = feedbackRepository.findByIdWithJoins(saved.getId())
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        try {
            if (full.getCustomer() != null && full.getCustomer().getEmail() != null) {
                String statusUpdatedMessage = systemSettingService.renderTemplate(
                        "template_status_updated",
                        "Hello {customerName}, your feedback status changed from {fromStatus} to {toStatus}.",
                        Map.of(
                                "customerName", full.getCustomer().getFullName(),
                                "fromStatus", String.valueOf(from),
                                "toStatus", String.valueOf(status),
                                "note", note == null ? "" : note
                        )
                );

                emailService.sendSimpleEmail(
                        full.getCustomer().getEmail(),
                        "SmartVoice Feedback Status Updated",
                        statusUpdatedMessage + ((note != null && !note.isBlank()) ? "\n\nNote: " + note : "")
                );

                String notifStatusUpdated = systemSettingService.renderTemplate(
                        "template_notification_status_updated",
                        "Your feedback status changed from {fromStatus} to {toStatus}.",
                        Map.of(
                                "customerName", full.getCustomer().getFullName(),
                                "category", full.getCategory(),
                                "fromStatus", String.valueOf(from),
                                "toStatus", String.valueOf(status),
                                "note", note == null ? "" : note
                        )
                );

                notificationService.createNotification(
                        full.getCustomer().getId(),
                        "Status updated",
                        notifStatusUpdated + ((note != null && !note.isBlank()) ? " Note: " + note : ""),
                        actor.getFullName(),
                        actor.getEmail()
                );
            }
        } catch (Exception e) {
            System.out.println("STATUS EMAIL/NOTIFICATION ERROR => " + e.getMessage());
        }

        return FeedbackResponse.fromEntity(full);
    }

    public List<FeedbackResponse> getAssignedToStaff(UUID staffId) {
        return feedbackRepository.findAssignedToStaff(staffId)
                .stream()
                .map(FeedbackResponse::fromEntity)
                .toList();
    }

    public FeedbackResponse setEscalated(UUID feedbackId, boolean escalated) {
        Feedback f = getById(feedbackId);
        f.setEscalated(escalated);

        Feedback saved = feedbackRepository.saveAndFlush(f);
        Feedback full = feedbackRepository.findByIdWithJoins(saved.getId())
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));

        try {
            if (full.getCustomer() != null && full.getCustomer().getEmail() != null) {
                emailService.sendSimpleEmail(
                        full.getCustomer().getEmail(),
                        "SmartVoice Feedback Escalation Update",
                        "Hello " + full.getCustomer().getFullName() + ",\n\n"
                                + "Your feedback escalation status is now: " + (escalated ? "ESCALATED" : "NOT ESCALATED")
                );

                String notifEscalated = systemSettingService.renderTemplate(
                        "template_notification_escalated",
                        "Your feedback about {category} has been escalated.",
                        Map.of(
                                "customerName", full.getCustomer().getFullName(),
                                "category", full.getCategory(),
                                "status", String.valueOf(full.getStatus())
                        )
                );

                String finalEscalationMessage = escalated
                        ? notifEscalated
                        : "Your feedback about " + full.getCategory() + " is no longer escalated.";

                notificationService.createNotification(
                        full.getCustomer().getId(),
                        "Escalation update",
                        finalEscalationMessage,
                        "SmartVoice",
                        "noreply@smartvoice.local"
                );
            }
        } catch (Exception e) {
            System.out.println("ESCALATION CUSTOMER EMAIL/NOTIFICATION ERROR => " + e.getMessage());
        }

        try {
            List<User> managers = userRepository.findByRoleIn(List.of(Role.MANAGER, Role.ADMIN));

            for (User u : managers) {
                if (u.getEmail() != null && !u.getEmail().isBlank()) {
                    emailService.sendSimpleEmail(
                            u.getEmail(),
                            "SmartVoice Feedback Escalated",
                            "Hello " + u.getFullName() + ",\n\n"
                                    + "A feedback has been escalated.\n\n"
                                    + "Customer: " + (full.getCustomer() != null ? full.getCustomer().getFullName() : "-") + "\n"
                                    + "Category: " + full.getCategory() + "\n"
                                    + "Priority: " + full.getPriority() + "\n"
                                    + "Status: " + full.getStatus() + "\n"
                                    + "Message: " + full.getMessage()
                    );
                }

                notificationService.createNotification(
                        u.getId(),
                        "Case escalated",
                        "A feedback from "
                                + (full.getCustomer() != null ? full.getCustomer().getFullName() : "customer")
                                + " (" + (full.getCustomer() != null ? full.getCustomer().getEmail() : "-") + ")"
                                + " has been escalated.",
                        full.getCustomer() != null ? full.getCustomer().getFullName() : "Customer",
                        full.getCustomer() != null ? full.getCustomer().getEmail() : "-"
                );
            }
        } catch (Exception e) {
            System.out.println("ESCALATION MANAGER/ADMIN EMAIL/NOTIFICATION ERROR => " + e.getMessage());
        }

        return FeedbackResponse.fromEntity(full);
    }
}