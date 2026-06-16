package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.smartvoice.model.SurveyAnswer;

import java.util.List;
import java.util.UUID;

public interface SurveyAnswerRepository extends JpaRepository<SurveyAnswer, UUID> {
    List<SurveyAnswer> findByResponse_Id(UUID responseId);
}
