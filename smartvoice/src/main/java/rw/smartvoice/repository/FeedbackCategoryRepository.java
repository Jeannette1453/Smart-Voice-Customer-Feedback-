package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.smartvoice.model.FeedbackCategory;

import java.util.UUID;

public interface FeedbackCategoryRepository extends JpaRepository<FeedbackCategory, UUID> {
    boolean existsByNameIgnoreCase(String name);
}