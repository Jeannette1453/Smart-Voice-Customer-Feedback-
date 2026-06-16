package rw.smartvoice.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import rw.smartvoice.dto.AttachmentResponse;
import rw.smartvoice.model.Attachment;
import rw.smartvoice.service.AttachmentService;
import rw.smartvoice.util.SecurityUtil;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    private String currentEmail() {
        String email = SecurityUtil.currentEmail();
        if (email == null) throw new IllegalArgumentException("Not authenticated");
        return email;
    }

    // ✅ Upload attachment to a feedback
    // POST /api/feedback/{feedbackId}/attachments
    @PreAuthorize("isAuthenticated()")
    @PostMapping(value = "/feedback/{feedbackId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponse> upload(@PathVariable UUID feedbackId,
                                                     @RequestPart("file") MultipartFile file) throws IOException {
        return ResponseEntity.status(201).body(
                attachmentService.upload(feedbackId, file, currentEmail())
        );
    }

    // ✅ List attachments of a feedback
    // GET /api/feedback/{feedbackId}/attachments
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/feedback/{feedbackId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> list(@PathVariable UUID feedbackId) {
        return ResponseEntity.ok(attachmentService.list(feedbackId, currentEmail()));
    }

    // ✅ Download attachment
    // GET /api/attachments/{attachmentId}/download
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID attachmentId) throws MalformedURLException {
        Attachment meta = attachmentService.getMeta(attachmentId, currentEmail());
        Resource file = attachmentService.loadAsResource(attachmentId, currentEmail());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getOriginalName() + "\"")
                .contentType(MediaType.parseMediaType(meta.getContentType()))
                .body(file);
    }

    // ✅ Delete attachment
    // DELETE /api/attachments/{attachmentId}
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> delete(@PathVariable UUID attachmentId) throws IOException {
        attachmentService.delete(attachmentId, currentEmail());
        return ResponseEntity.noContent().build();
    }
}