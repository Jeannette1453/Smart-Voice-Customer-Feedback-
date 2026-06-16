package rw.smartvoice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import rw.smartvoice.dto.AttachmentResponse;
import rw.smartvoice.model.Attachment;
import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.Role;
import rw.smartvoice.model.User;
import rw.smartvoice.repository.AttachmentRepository;
import rw.smartvoice.repository.FeedbackRepository;
import rw.smartvoice.repository.UserRepository;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    private final Path uploadDir;

    public AttachmentService(AttachmentRepository attachmentRepository,
                             FeedbackRepository feedbackRepository,
                             UserRepository userRepository,
                             @Value("${smartvoice.upload.dir:uploads}") String uploadDir) throws IOException {
        this.attachmentRepository = attachmentRepository;
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;

        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadDir);
    }

    private Feedback getFeedback(UUID feedbackId) {
        return feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found"));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // CUSTOMER can access ONLY their feedback
    // STAFF/MANAGER/ADMIN can access all
    private void checkCanAccessFeedback(User user, Feedback feedback) {
        if (user.getRole() == Role.CUSTOMER) {
            if (!feedback.getCustomer().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Not allowed (not your feedback)");
            }
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File is required");
        if (file.getSize() > 10 * 1024 * 1024) throw new IllegalArgumentException("File too large (max 10MB)");

        String type = (file.getContentType() == null) ? "" : file.getContentType().toLowerCase();

        boolean ok =
                type.startsWith("image/") ||
                type.equals("application/pdf") ||
                type.equals("application/msword") ||
                type.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                type.equals("application/vnd.ms-excel") ||
                type.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        if (!ok) throw new IllegalArgumentException("Unsupported file type: " + file.getContentType());
    }

    public AttachmentResponse upload(UUID feedbackId, MultipartFile file, String actorEmail) throws IOException {
        validateFile(file);

        Feedback feedback = getFeedback(feedbackId);
        User actor = getUserByEmail(actorEmail);
        checkCanAccessFeedback(actor, feedback);

        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String stored = UUID.randomUUID() + "_" + original.replaceAll("[^a-zA-Z0-9._-]", "_");

        Path target = uploadDir.resolve(stored).normalize();
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        Attachment a = new Attachment();
        a.setFeedback(feedback);
        a.setOriginalName(original);
        a.setStoredName(stored);
        a.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
        a.setSize(file.getSize());

        return AttachmentResponse.fromEntity(attachmentRepository.save(a));
    }

    public List<AttachmentResponse> list(UUID feedbackId, String actorEmail) {
        Feedback feedback = getFeedback(feedbackId);
        User actor = getUserByEmail(actorEmail);
        checkCanAccessFeedback(actor, feedback);

        return attachmentRepository.findByFeedback_IdOrderByCreatedAtDesc(feedbackId)
                .stream().map(AttachmentResponse::fromEntity).toList();
    }

    // ✅ UPDATED: check file exists
    public Resource loadAsResource(UUID attachmentId, String actorEmail) throws MalformedURLException {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        User actor = getUserByEmail(actorEmail);
        checkCanAccessFeedback(actor, a.getFeedback());

        Path filePath = uploadDir.resolve(a.getStoredName()).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            throw new IllegalArgumentException("File not found on disk");
        }
        return resource;
    }

    public Attachment getMeta(UUID attachmentId, String actorEmail) {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        User actor = getUserByEmail(actorEmail);
        checkCanAccessFeedback(actor, a.getFeedback());

        return a;
    }

    public void delete(UUID attachmentId, String actorEmail) throws IOException {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        User actor = getUserByEmail(actorEmail);
        checkCanAccessFeedback(actor, a.getFeedback());

        Path filePath = uploadDir.resolve(a.getStoredName()).normalize();
        Files.deleteIfExists(filePath);
        attachmentRepository.delete(a);
    }
}