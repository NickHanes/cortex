package com.study.cortex.flashcard;

import com.study.cortex.note.Note;
import com.study.cortex.note.NoteRepository;
import com.study.cortex.service.StudyAIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/flashcards")
public class FlashcardController {

    private final FlashcardRepository flashcardRepository;
    private final NoteRepository noteRepository;
    private final StudyAIService studyAIService;

    public FlashcardController(FlashcardRepository flashcardRepository,
                               NoteRepository noteRepository,
                               StudyAIService studyAIService) {
        this.flashcardRepository = flashcardRepository;
        this.noteRepository = noteRepository;
        this.studyAIService = studyAIService;
    }

    // Get all flashcards for a note
    @GetMapping("/note/{noteId}")
    public List<Flashcard> getByNote(@PathVariable Long noteId) {
        return flashcardRepository.findByNoteId(noteId);
    }

    // Manually create a flashcard
    @PostMapping("/note/{noteId}")
    public ResponseEntity<?> create(@PathVariable Long noteId,
                                    @RequestBody Map<String, String> body) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        Flashcard card = new Flashcard();
        card.setQuestion(body.get("question"));
        card.setAnswer(body.get("answer"));
        card.setNote(note);

        return ResponseEntity.ok(flashcardRepository.save(card));
    }

    // AI generate flashcards from a note
    @PostMapping("/note/{noteId}/generate")
    public ResponseEntity<?> generate(@PathVariable Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        List<Map<String, String>> generated = studyAIService.generateFlashcards(note.getContent());

        List<Flashcard> saved = generated.stream()
                .limit(20) // safety cap matches prompt maximum
                .map(card -> {
                    Flashcard f = new Flashcard();
                    f.setQuestion(card.get("question"));
                    f.setAnswer(card.get("answer"));
                    f.setNote(note);
                    return flashcardRepository.save(f);
                }).toList();

        return ResponseEntity.ok(saved);
    }

    // Edit a flashcard
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @RequestBody Map<String, String> body) {
        Flashcard card = flashcardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Flashcard not found"));
        card.setQuestion(body.get("question"));
        card.setAnswer(body.get("answer"));
        return ResponseEntity.ok(flashcardRepository.save(card));
    }

    // Delete a flashcard
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!flashcardRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        flashcardRepository.deleteById(id);
        return ResponseEntity.ok("Flashcard deleted");
    }
}