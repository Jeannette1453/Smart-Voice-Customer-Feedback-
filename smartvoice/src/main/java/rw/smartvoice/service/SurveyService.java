package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.smartvoice.dto.*;
import rw.smartvoice.model.*;
import rw.smartvoice.repository.SurveyRepository;
import rw.smartvoice.repository.SurveyResponseRepository;
import rw.smartvoice.repository.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SurveyService {

    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository responseRepository;
    private final UserRepository userRepository;

    public SurveyService(SurveyRepository surveyRepository,
                         SurveyResponseRepository responseRepository,
                         UserRepository userRepository) {
        this.surveyRepository = surveyRepository;
        this.responseRepository = responseRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SurveyResponseDto createSurvey(UUID creatorId, CreateSurveyRequest req) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new IllegalArgumentException("Creator not found"));

        Survey s = new Survey();
        s.setTitle(req.title);
        s.setDescription(req.description);
        s.setActive(req.active);
        s.setCreatedBy(creator);

        // add questions
        for (CreateSurveyRequest.QuestionItem qi : req.questions) {
            SurveyQuestion q = new SurveyQuestion();
            q.setSurvey(s);
            q.setQuestionText(qi.questionText);
            q.setType(qi.type);
            q.setOrderIndex(qi.orderIndex);

            if (qi.type == QuestionType.MULTIPLE_CHOICE && qi.options != null && !qi.options.isEmpty()) {
                q.setOptionsText(String.join("|", qi.options));
            }

            s.getQuestions().add(q);
        }

        Survey saved = surveyRepository.save(s);
        return SurveyResponseDto.fromEntity(saved);
    }

    @Transactional
public SurveyResponseDto setActive(UUID surveyId, boolean active) {
    Survey s = surveyRepository.findById(surveyId)
            .orElseThrow(() -> new IllegalArgumentException("Survey not found"));

    s.setActive(active);
    Survey saved = surveyRepository.save(s);
    return SurveyResponseDto.fromEntityNoQuestions(saved);
}

    public List<SurveyResponseDto> listActive() {
        return surveyRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(SurveyResponseDto::fromEntityNoQuestions)
                .toList();
    }

    public List<SurveyResponseDto> listAll() {
    return surveyRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(SurveyResponseDto::fromEntityNoQuestions)
            .toList();
}


    public SurveyResponseDto getSurvey(UUID surveyId) {
        Survey s = surveyRepository.findByIdWithQuestions(surveyId)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found"));
        return SurveyResponseDto.fromEntity(s);
    }

    @Transactional
    public void submit(UUID customerId, UUID surveyId, SubmitSurveyRequest req) {
        if (responseRepository.existsBySurvey_IdAndCustomer_Id(surveyId, customerId)) {
            throw new IllegalArgumentException("You already submitted this survey");
        }

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Survey survey = surveyRepository.findByIdWithQuestions(surveyId)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found"));

        SurveyResponse r = new SurveyResponse();
        r.setSurvey(survey);
        r.setCustomer(customer);

        Map<UUID, SurveyQuestion> qMap = survey.getQuestions().stream()
                .collect(Collectors.toMap(SurveyQuestion::getId, x -> x));

        for (SubmitSurveyRequest.AnswerItem a : req.answers) {
            SurveyQuestion q = qMap.get(a.questionId);
            if (q == null) continue;

            SurveyAnswer ans = new SurveyAnswer();
            ans.setResponse(r);
            ans.setQuestion(q);
            ans.setAnswerText(a.answerText);

            r.getAnswers().add(ans);
        }

        responseRepository.save(r);
    }

    public SurveyResultsDto results(UUID surveyId) {
        Survey survey = surveyRepository.findByIdWithQuestions(surveyId)
                .orElseThrow(() -> new IllegalArgumentException("Survey not found"));

        List<SurveyResponse> responses = responseRepository.findAllBySurveyWithDetails(surveyId);

        SurveyResultsDto dto = new SurveyResultsDto();
        dto.surveyId = survey.getId();
        dto.title = survey.getTitle();
        dto.totalResponses = responses.size();

        dto.questions = survey.getQuestions().stream().map(q -> {
            SurveyResultsDto.QuestionResult qr = new SurveyResultsDto.QuestionResult();
            qr.questionId = q.getId();
            qr.questionText = q.getQuestionText();

            Map<String, Long> counts = new LinkedHashMap<>();
            for (SurveyResponse r : responses) {
                r.getAnswers().forEach(a -> {
                    if (a.getQuestion().getId().equals(q.getId())) {
                        String key = (a.getAnswerText() == null || a.getAnswerText().isBlank())
                                ? "(empty)"
                                : a.getAnswerText().trim();
                        counts.put(key, counts.getOrDefault(key, 0L) + 1);
                    }
                });
            }
            qr.counts = counts;
            return qr;
        }).toList();

        return dto;
    }
}
