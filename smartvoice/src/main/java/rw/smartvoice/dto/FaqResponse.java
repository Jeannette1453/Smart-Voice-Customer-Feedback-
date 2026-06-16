package rw.smartvoice.dto;

import rw.smartvoice.model.Faq;

import java.time.Instant;
import java.util.UUID;

public class FaqResponse {
    public UUID id;
    public String question;
    public String answer;
    public String category;  // ✅ IMPORTANT
    public boolean active;
    public Instant createdAt;
    public Instant updatedAt;

    public static FaqResponse fromEntity(Faq f) {
        FaqResponse r = new FaqResponse();
        r.id = f.getId();
        r.question = f.getQuestion();
        r.answer = f.getAnswer();
        r.category = f.getCategory(); // ✅ IMPORTANT
        r.active = f.isActive();
        r.createdAt = f.getCreatedAt();
        r.updatedAt = f.getUpdatedAt();
        return r;
    }
}