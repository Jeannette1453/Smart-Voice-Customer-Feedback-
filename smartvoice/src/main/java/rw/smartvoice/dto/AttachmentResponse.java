package rw.smartvoice.dto;

import rw.smartvoice.model.Attachment;

import java.time.Instant;
import java.util.UUID;

public class AttachmentResponse {
    public UUID id;
    public UUID feedbackId;
    public String originalName;
    public String contentType;
    public long size;
    public Instant createdAt;

    public static AttachmentResponse fromEntity(Attachment a) {
        AttachmentResponse r = new AttachmentResponse();
        r.id = a.getId();
        r.feedbackId = a.getFeedback().getId();
        r.originalName = a.getOriginalName();
        r.contentType = a.getContentType();
        r.size = a.getSize();
        r.createdAt = a.getCreatedAt();
        return r;
    }
}