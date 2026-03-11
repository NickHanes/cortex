package com.study.cortex.resources;

import com.fasterxml.jackson.databind.JsonNode;
import com.study.cortex.progress.StudyActivity;
import com.study.cortex.progress.StudyActivityRepository;
import com.study.cortex.service.StudyAIService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.study.cortex.note.Note;
import com.study.cortex.note.NoteRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/resources")
public class ResourceController {

    private final StudyAIService studyAIService;
    private final StudyActivityRepository activityRepository;
    private final NoteRepository noteRepository;

    public ResourceController(StudyAIService studyAIService,
                              StudyActivityRepository activityRepository, NoteRepository noteRepository) {
        this.studyAIService = studyAIService;
        this.activityRepository = activityRepository;
        this.noteRepository = noteRepository;
    }

    @PostMapping("/recommend")
    public ResponseEntity<?> recommend(@RequestBody Map<String, Object> body,
                                       Authentication auth) {
        String topic = (String) body.get("topic");
        String username = auth.getName();

        // Pull actual note content if noteId is provided
        String noteContent = "";
        if (body.get("noteId") != null) {
            Long noteId = Long.valueOf(body.get("noteId").toString());
            noteContent = noteRepository.findById(noteId)
                    .map(Note::getContent)
                    .orElse("");
        }

        // Build context from quiz history
        List<StudyActivity> quizzes = activityRepository
                .findByUsernameAndType(username, StudyActivity.ActivityType.QUIZ_COMPLETED);

        String quizContext = quizzes.stream()
                .filter(a -> a.getNoteName() != null)
                .map(a -> a.getNoteName() + ": " + a.getValue() + "%")
                .collect(Collectors.joining(", "));

        if (quizContext.isEmpty()) quizContext = "No quiz history available yet.";

        // Combine note content + quiz context
        String fullContext = noteContent.isEmpty()
                ? quizContext
                : "NOTE CONTENT:\n" + noteContent.substring(0, Math.min(noteContent.length(), 3000)) + "\n\nQUIZ HISTORY:\n" + quizContext;

        JsonNode result = studyAIService.generateResources(topic, fullContext);

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(result.toString());
    }

    // Get weak topics from quiz history
    @GetMapping("/weak-topics")
    public ResponseEntity<?> weakTopics(Authentication auth) {
        String username = auth.getName();

        List<StudyActivity> quizzes = activityRepository
                .findByUsernameAndType(username, StudyActivity.ActivityType.QUIZ_COMPLETED);

        // Group by note, find averages, return ones below 75%
        Map<String, Double> averages = quizzes.stream()
                .filter(a -> a.getNoteName() != null)
                .collect(Collectors.groupingBy(
                        StudyActivity::getNoteName,
                        Collectors.averagingInt(StudyActivity::getValue)
                ));

        List<Map<String, Object>> weakTopics = averages.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .map(e -> Map.<String, Object>of(
                        "topic", e.getKey(),
                        "averageScore", Math.round(e.getValue())
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(weakTopics);
    }
}
