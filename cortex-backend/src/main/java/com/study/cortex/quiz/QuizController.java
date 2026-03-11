package com.study.cortex.quiz;

import com.study.cortex.note.Note;
import com.study.cortex.note.NoteRepository;
import com.study.cortex.service.StudyAIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.study.cortex.progress.StudyActivity;
import com.study.cortex.progress.StudyActivityRepository;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/quiz")
public class QuizController {

    private final QuizQuestionRepository quizRepository;
    private final NoteRepository noteRepository;
    private final StudyAIService studyAIService;
    private final StudyActivityRepository activityRepository;

    public QuizController(QuizQuestionRepository quizRepository,
                          NoteRepository noteRepository,
                          StudyAIService studyAIService, StudyActivityRepository activityRepository) {
        this.quizRepository = quizRepository;
        this.noteRepository = noteRepository;
        this.studyAIService = studyAIService;
        this.activityRepository = activityRepository;
    }

    @PostMapping("/note/{noteId}/complete")
    public ResponseEntity<?> logComplete(@PathVariable Long noteId,
                                         @RequestBody Map<String, Integer> body,
                                         Authentication auth) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        StudyActivity activity = new StudyActivity();
        activity.setUsername(auth.getName());
        activity.setType(StudyActivity.ActivityType.QUIZ_COMPLETED);
        activity.setValue(body.get("score"));
        activity.setNoteId(noteId);
        activity.setNoteName(note.getTitle());
        activity.setDate(java.time.LocalDate.now());
        activity.setTimestamp(java.time.LocalDateTime.now());

        activityRepository.save(activity);
        return ResponseEntity.ok("Quiz result logged");
    }

    // Get all questions for a note
    @GetMapping("/note/{noteId}")
    public List<QuizQuestion> getByNote(@PathVariable Long noteId) {
        return quizRepository.findByNoteId(noteId);
    }

    // AI generate quiz from a note
    @PostMapping("/note/{noteId}/generate")
    public ResponseEntity<?> generate(@PathVariable Long noteId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        List<Map<String, Object>> generated = studyAIService.generateQuiz(note.getContent());

        List<QuizQuestion> saved = generated.stream()
                .limit(15)
                .map(q -> {
                    QuizQuestion question = new QuizQuestion();
                    question.setQuestion((String) q.get("question"));
                    question.setType(QuizQuestion.QuestionType.valueOf((String) q.get("type")));
                    question.setOptions((List<String>) q.get("options"));
                    question.setCorrectAnswer((String) q.get("correctAnswer"));
                    question.setNote(note);
                    return quizRepository.save(question);
                }).toList();

        return ResponseEntity.ok(saved);
    }

    // Manually add a question
    @PostMapping("/note/{noteId}")
    public ResponseEntity<?> create(@PathVariable Long noteId,
                                    @RequestBody Map<String, Object> body) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        QuizQuestion question = new QuizQuestion();
        question.setQuestion((String) body.get("question"));
        question.setType(QuizQuestion.QuestionType.valueOf((String) body.get("type")));
        question.setOptions((List<String>) body.get("options"));
        question.setCorrectAnswer((String) body.get("correctAnswer"));
        question.setNote(note);

        return ResponseEntity.ok(quizRepository.save(question));
    }

    // Delete a question
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!quizRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        quizRepository.deleteById(id);
        return ResponseEntity.ok("Question deleted");
    }
}
