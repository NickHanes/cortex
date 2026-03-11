package com.study.cortex.note;

import com.study.cortex.service.StudyAIService;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;
import com.study.cortex.service.StudyAIService;
import org.springframework.http.ResponseEntity;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

@RestController
@RequestMapping("/notes")
public class NoteController {

    private final NoteRepository repository;
    private final StudyAIService studyAIService;

    public NoteController(NoteRepository repository,
                          StudyAIService studyAIService) {
        this.repository = repository;
        this.studyAIService = studyAIService;
    }

    @PostMapping
    public Note create(@RequestBody Note note) {
        return repository.save(note);
    }

    @GetMapping
    public List<Note> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}/summarize")
    public String summarize(@PathVariable Long id) {

        Note note = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        var aiResult = studyAIService.processStudyMaterial(note.getContent());

        return aiResult.get("summary").asText();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok("Note deleted");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Note note = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));
        if (body.get("title") != null) note.setTitle(body.get("title"));
        if (body.get("content") != null) note.setContent(body.get("content"));
        return ResponseEntity.ok(repository.save(note));
    }

    @PostMapping("/{id}/mindmap")
    public ResponseEntity<?> mindmap(@PathVariable Long id) {
        Note note = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        JsonNode result = studyAIService.generateMindMap(note.getContent());

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(result.toString());
    }
}