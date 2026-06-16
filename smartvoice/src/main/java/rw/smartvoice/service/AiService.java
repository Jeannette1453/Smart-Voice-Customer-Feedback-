package rw.smartvoice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import rw.smartvoice.dto.AiClassifyRequest;
import rw.smartvoice.dto.AiClassifyResponse;

@Service
public class AiService {

    @Value("${app.ai.enabled:false}")
    private boolean enabled;

    @Value("${app.ai.base-url:http://localhost:8000}")
    private String baseUrl;

    private final WebClient webClient;

    public AiService(WebClient webClient) {
        this.webClient = webClient;
    }

    public AiClassifyResponse classify(String text) {
        if (!enabled) return null;

        return webClient.post()
                .uri(baseUrl + "/classify")
                .bodyValue(new AiClassifyRequest(text))
                .retrieve()
                .bodyToMono(AiClassifyResponse.class)
                .block();
    }
}
