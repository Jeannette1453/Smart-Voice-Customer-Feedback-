package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import rw.smartvoice.model.Survey;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SurveyRepository extends JpaRepository<Survey, UUID> {

    List<Survey> findByActiveTrueOrderByCreatedAtDesc();
    List<Survey> findAllByOrderByCreatedAtDesc();
    @Query("""
      select s from Survey s
      left join fetch s.questions
      where s.id = :id
    """)
    Optional<Survey> findByIdWithQuestions(UUID id);
}
