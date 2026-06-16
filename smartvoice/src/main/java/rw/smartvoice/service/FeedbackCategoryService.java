package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.smartvoice.dto.FeedbackCategoryRequest;
import rw.smartvoice.model.FeedbackCategory;
import rw.smartvoice.repository.FeedbackCategoryRepository;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FeedbackCategoryService {

    private final FeedbackCategoryRepository feedbackCategoryRepository;

    public FeedbackCategoryService(FeedbackCategoryRepository feedbackCategoryRepository) {
        this.feedbackCategoryRepository = feedbackCategoryRepository;
    }

    public List<FeedbackCategory> all() {
        return feedbackCategoryRepository.findAll();
    }

    public FeedbackCategory create(FeedbackCategoryRequest req) {
        String name = req.name.trim();

        if (feedbackCategoryRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Category already exists");
        }

        FeedbackCategory c = new FeedbackCategory();
        c.setName(name);
        return feedbackCategoryRepository.save(c);
    }

    public void delete(UUID id) {
        feedbackCategoryRepository.deleteById(id);
    }
}