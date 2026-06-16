package rw.smartvoice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import rw.smartvoice.dto.AiAnalyzeResponse;

import java.util.HashMap;
import java.util.Map;

@Service
public class AiRoutingService {

    private final RestClient restClient;
    private final String baseUrl;

    public AiRoutingService(RestClient.Builder builder,
                            @Value("${ai.service.base-url:http://localhost:8001}") String baseUrl) {
        this.restClient = builder.build();
        this.baseUrl = baseUrl;
    }

    public AiAnalyzeResponse analyze(String message, String category, String subCategory) {
        Map<String, Object> body = new HashMap<>();
        body.put("message", message);
        body.put("category", category);
        body.put("subCategory", subCategory);

        return restClient.post()
                .uri(baseUrl + "/analyze")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(AiAnalyzeResponse.class);
    }
}