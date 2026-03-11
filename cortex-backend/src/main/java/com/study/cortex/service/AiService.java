package com.study.cortex.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;

@Service
public class AiService {

    private final RestTemplate restTemplate = new RestTemplate();

    public String ask(String prompt) {
        try {
            String url = "http://localhost:11434/api/generate";

            Map<String, Object> request = Map.of(
                    "model", "llama3:latest",
                    "prompt", prompt,
                    "stream", false
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity =
                    new HttpEntity<>(request, headers);

            ResponseEntity<Map> response =
                    restTemplate.postForEntity(url, entity, Map.class);

            return (String) response.getBody().get("response");
        } catch (Exception e) {
            System.err.println("Ollama call failed: " + e.getMessage());
            throw e;
        }
    }
}