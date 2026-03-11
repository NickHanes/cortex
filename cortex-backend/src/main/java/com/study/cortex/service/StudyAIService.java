package com.study.cortex.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class StudyAIService {

    private final AiService aiService;
    private final ObjectMapper mapper;

    public StudyAIService(AiService aiService) {
        this.aiService = aiService;
        this.mapper = new ObjectMapper();
    }

    public JsonNode processStudyMaterial(String text) {
        String prompt = """
        You are an AI study assistant analyzing handwritten notes that were processed by OCR.
        The OCR text may contain errors, misspellings, garbled words, or missing letters.
        
        Your job:
        1. Intelligently reconstruct what the original notes likely said
        2. Fix all OCR errors using context clues
        3. Write a clear summary of the content
        
        Return ONLY valid JSON, no markdown, no extra text:
        {
          "corrected_text": "...",
          "summary": "..."
        }
        
        OCR Text:
        """ + text.replaceAll("\\\\", " ");

        try {
            String response = aiService.ask(prompt);

            int start = response.indexOf("{");
            int end = response.lastIndexOf("}") + 1;

            if (start == -1 || end <= start) {
                return buildFallback(text, "Summary unavailable — AI returned invalid response");
            }

            response = response.substring(start, end);
            response = response.replaceAll("\\\\(?![\"\\\\bfnrtu])", "\\\\\\\\");

            try {
                return mapper.readTree(response);
            } catch (Exception parseEx) {
                // JSON was truncated or malformed — return raw text safely
                return buildFallback(text, "Summary unavailable — AI response was truncated");
            }

        } catch (Exception e) {
            // Never crash the upload — always return something usable
            try {
                return buildFallback(text, "AI processing unavailable");
            } catch (Exception ex) {
                throw new RuntimeException("AI processing failed: " + e.getMessage(), e);
            }
        }
    }

    private JsonNode buildFallback(String text, String summary) throws Exception {
        return mapper.readTree("{\"corrected_text\": " +
                mapper.writeValueAsString(text) +
                ", \"summary\": " +
                mapper.writeValueAsString(summary) + "}");
    }

    public List<Map<String, String>> generateFlashcards(String text) {
        String trimmedText = text.length() > 6000 ? text.substring(0, 6000) : text;

        String prompt = """
        You are an AI study assistant. Generate flashcards from the study material below.
        
        RULES:
        - Read the entire material and identify every distinct concept, fact, or topic
        - Create one flashcard per concept — enough to cover ALL key points
        - Minimum 3 flashcards, maximum 20 flashcards
        - If the material is simple, use fewer. If complex, use more.
        - Return ONLY a JSON array, no markdown, no extra text, no explanation
        
        Format:
        [
          {"question": "...", "answer": "..."}
        ]
        
        Study material:
        """ + trimmedText.replaceAll("\\\\", " ");

        try {
            String response = aiService.ask(prompt);

            int start = response.indexOf("[");
            int end = response.lastIndexOf("]") + 1;
            if (start != -1 && end > start) {
                response = response.substring(start, end);
            }

            response = response.replaceAll("\\\\(?![\"\\\\bfnrtu])", "\\\\\\\\");

            JsonNode array = mapper.readTree(response);
            List<Map<String, String>> flashcards = new ArrayList<>();

            for (JsonNode card : array) {
                Map<String, String> map = new HashMap<>();
                map.put("question", card.get("question").asText());
                map.put("answer", card.get("answer").asText());
                flashcards.add(map);
            }

            return flashcards;

        } catch (Exception e) {
            throw new RuntimeException("Flashcard generation failed: " + e.getMessage(), e);
        }
    }

    public List<Map<String, Object>> generateQuiz(String text) {
        String trimmedText = text.length() > 6000 ? text.substring(0, 6000) : text;

        String prompt = """
        You are an AI study assistant. Generate quiz questions from the study material below.
    
        RULES:
        - Generate a mix of MULTIPLE_CHOICE and TRUE_FALSE questions
        - Cover all key concepts in the material
        - I shouldn't have to click generate twice to get all content in quiz, just cover all of it please
        - Minimum 3 questions, maximum 15 questions
        - For MULTIPLE_CHOICE: provide exactly 4 options as full text strings
        - For TRUE_FALSE: options must be exactly ["True", "False"]
        - correctAnswer must be the FULL TEXT of the correct option, not a letter like A or B
        - Return ONLY a valid JSON array, no markdown, no extra text
    
        Format:
        [
        {
            "question": "What is the powerhouse of the cell?",
            "type": "MULTIPLE_CHOICE",
            "options": ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
            "correctAnswer": "Mitochondria"
        },
        {
            "question": "The earth is flat.",
            "type": "TRUE_FALSE",
            "options": ["True", "False"],
            "correctAnswer": "False"
         }
        ]
    
        Study material:
        """ + trimmedText.replaceAll("\\\\", " ");

        try {
            String response = aiService.ask(prompt);

            int start = response.indexOf("[");
            int end = response.lastIndexOf("]") + 1;
            if (start != -1 && end > start) {
                response = response.substring(start, end);
            }

            response = response.replaceAll("\\\\(?![\"\\\\bfnrtu])", "\\\\\\\\");

            JsonNode array = mapper.readTree(response);
            List<Map<String, Object>> questions = new ArrayList<>();

            for (JsonNode q : array) {
                Map<String, Object> map = new HashMap<>();
                map.put("question", q.get("question").asText());
                map.put("type", q.get("type").asText());
                map.put("correctAnswer", q.get("correctAnswer").asText());

                List<String> options = new ArrayList<>();
                for (JsonNode opt : q.get("options")) {
                    options.add(opt.asText());
                }
                map.put("options", options);
                questions.add(map);
            }

            return questions;

        } catch (Exception e) {
            throw new RuntimeException("Quiz generation failed: " + e.getMessage(), e);
        }
    }

    public JsonNode generateResources(String topic, String context) {
        String prompt = """
        You are an expert study advisor. A student is struggling with the following topic:
        
        TOPIC: """ + topic + """
        
        CONTEXT (their recent performance):
        """ + context + """
        
        Generate helpful study resources and recommendations.
        
        Return ONLY a valid JSON object, no markdown, no extra text:
        {
          "keyConcepts": [
            {"concept": "...", "explanation": "..."},
            {"concept": "...", "explanation": "..."}
          ],
          "studyTechniques": [
            {"technique": "...", "description": "..."}
          ],
          "practiceProblems": [
            {"problem": "...", "hint": "..."}
          ],
          "youtubeSearches": [
            {"query": "...", "reason": "..."}
          ],
          "articleSearches": [
            {"query": "...", "reason": "..."}
          ]
        }
        
        Rules:
        - keyConcepts: 3-5 core concepts they must understand
        - studyTechniques: 2-3 specific techniques suited to this topic
        - practiceProblems: 2-4 practice problems with hints
        - youtubeSearches: 2-3 specific search queries to find good videos
        - articleSearches: 2-3 specific search queries to find good articles
        - Be specific to the topic, not generic
        """;

        try {
            String response = aiService.ask(prompt);

            System.out.println("AI RESOURCES RESPONSE: " + response);

            int start = response.indexOf("{");
            int end = response.lastIndexOf("}") + 1;
            if (start != -1 && end > start) {
                response = response.substring(start, end);
            }

            response = response.replaceAll("\\\\(?![\"\\\\bfnrtu])", "\\\\\\\\");
            return mapper.readTree(response);

        } catch (Exception e) {
            throw new RuntimeException("Resource generation failed: " + e.getMessage(), e);
        }
    }

    public JsonNode generateMindMap(String text) {
        String trimmedText = text.length() > 4000 ? text.substring(0, 4000) : text;

        String prompt = """
        You are an AI study assistant. Analyze the study material below and generate a mind map.
        
        Return ONLY a valid JSON object, no markdown, no extra text:
        {
          "centralTopic": "Main Topic",
          "nodes": [
            {"id": "1", "label": "Concept A", "parent": "0"},
            {"id": "2", "label": "Concept B", "parent": "0"},
            {"id": "3", "label": "Detail of A", "parent": "1"},
            {"id": "4", "label": "Detail of A", "parent": "1"},
            {"id": "5", "label": "Detail of B", "parent": "2"}
          ]
        }
        
        Rules:
        - id "0" is reserved for the central topic
        - Each node must have a unique id (string number)
        - parent refers to the id of the parent node
        - Generate 6-14 nodes total covering all key concepts
        - Keep labels short (2-5 words max)
        - Create 2-4 main branches from center, each with 2-3 children
        
        Study material:
        """ + trimmedText.replaceAll("\\\\", " ");

        try {
            String response = aiService.ask(prompt);

            int start = response.indexOf("{");
            int end = response.lastIndexOf("}") + 1;
            if (start != -1 && end > start) {
                response = response.substring(start, end);
            }

            response = response.replaceAll("\\\\(?![\"\\\\bfnrtu])", "\\\\\\\\");
            return mapper.readTree(response);

        } catch (Exception e) {
            throw new RuntimeException("Mind map generation failed: " + e.getMessage(), e);
        }
    }
}