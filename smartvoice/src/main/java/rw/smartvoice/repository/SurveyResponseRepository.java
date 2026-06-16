package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import rw.smartvoice.model.SurveyResponse;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, UUID> {

    boolean existsBySurvey_IdAndCustomer_Id(UUID surveyId, UUID customerId);

    @Query("""
      select r from SurveyResponse r
      left join fetch r.customer
      left join fetch r.answers a
      left join fetch a.question
      where r.survey.id = :surveyId
      order by r.submittedAt desc
    """)
    List<SurveyResponse> findAllBySurveyWithDetails(UUID surveyId);

    Optional<SurveyResponse> findBySurvey_IdAndCustomer_Id(UUID surveyId, UUID customerId);

    void deleteByCustomer_Id(UUID customerId);
}
