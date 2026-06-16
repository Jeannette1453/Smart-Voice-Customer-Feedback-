package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.smartvoice.model.SurveyQuestion;

import java.util.List;
import java.util.UUID;

public interface SurveyQuestionRepository extends JpaRepository<SurveyQuestion, UUID> {
    List<SurveyQuestion> findBySurvey_Id(UUID surveyId);
}
