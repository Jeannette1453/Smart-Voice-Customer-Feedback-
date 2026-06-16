package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.smartvoice.model.Faq;

import java.util.List;
import java.util.UUID;

public interface FaqRepository extends JpaRepository<Faq, UUID> {

    List<Faq> findByActiveTrueOrderByCreatedAtDesc();

    List<Faq> findAllByOrderByCreatedAtDesc();
}