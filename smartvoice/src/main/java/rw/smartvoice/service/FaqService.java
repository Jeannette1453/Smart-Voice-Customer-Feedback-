package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import rw.smartvoice.dto.FaqRequest;
import rw.smartvoice.dto.FaqResponse;
import rw.smartvoice.model.Faq;
import rw.smartvoice.repository.FaqRepository;

import java.util.List;
import java.util.UUID;

@Service
public class FaqService {

    private final FaqRepository faqRepository;

    public FaqService(FaqRepository faqRepository) {
        this.faqRepository = faqRepository;
    }

    public List<FaqResponse> active() {
        return faqRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(FaqResponse::fromEntity)
                .toList();
    }

    public List<FaqResponse> all() {
        return faqRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(FaqResponse::fromEntity)
                .toList();
    }

    public FaqResponse create(FaqRequest req) {
        Faq f = new Faq();
        f.setQuestion(req.question);
        f.setAnswer(req.answer);

        String cat = (req.category == null || req.category.isBlank())
                ? "General"
                : req.category.trim();
        f.setCategory(cat);

        if (req.active != null) {
            f.setActive(req.active);
        }

        return FaqResponse.fromEntity(faqRepository.save(f));
    }

    public FaqResponse update(UUID id, FaqRequest req) {
        Faq f = faqRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FAQ not found"));

        if (req.question != null && !req.question.isBlank()) {
            f.setQuestion(req.question.trim());
        }

        if (req.answer != null && !req.answer.isBlank()) {
            f.setAnswer(req.answer.trim());
        }

        if (req.category != null && !req.category.isBlank()) {
            f.setCategory(req.category.trim());
        }

        if (req.active != null) {
            f.setActive(req.active);
        }

        return FaqResponse.fromEntity(faqRepository.save(f));
    }

    public void delete(UUID id) {
        faqRepository.deleteById(id);
    }

    public FaqResponse setActive(UUID id, boolean active) {
        Faq f = faqRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("FAQ not found"));

        f.setActive(active);
        return FaqResponse.fromEntity(faqRepository.save(f));
    }
}