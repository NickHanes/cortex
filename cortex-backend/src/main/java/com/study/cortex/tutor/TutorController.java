package com.study.cortex.tutor;

import com.study.cortex.note.Note;
import com.study.cortex.note.NoteRepository;
import com.study.cortex.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tutor")
public class TutorController {

    private final AiService aiService;
    private final NoteRepository noteRepository;

    public TutorController(AiService aiService, NoteRepository noteRepository) {
        this.aiService = aiService;
        this.noteRepository = noteRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body) {
        Long noteId = Long.valueOf(body.get("noteId").toString());
        String userMessage = (String) body.get("message");
        List<Map<String, String>> history = (List<Map<String, String>>) body.get("history");

        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        // Build conversation history as a string
        StringBuilder historyText = new StringBuilder();
        if (history != null) {
            for (Map<String, String> msg : history) {
                String role = msg.get("role").equals("user") ? "Student" : "Tutor";
                historyText.append(role).append(": ").append(msg.get("content")).append("\n");
            }
        }

        String prompt = """
            You are an expert AI tutor helping a student study the following notes.
            Your job is to:
            - Ask the student questions about the material to test their understanding
            - If they answer correctly, praise them and move on to the next concept
            - If they answer incorrectly, kindly explain why and give the correct answer
            - Keep explanations clear and concise
            - Stay focused only on the note content
            - Be encouraging and supportive
            - After every 2-3 exchanges, ask a new question about a different concept
            
            NOTE CONTENT:
            """ + note.getContent() + """
            
            CONVERSATION SO FAR:
            """ + historyText + """
            
            Student: """ + userMessage + """
            
            Tutor (respond naturally, and end with a follow-up question if appropriate):""";

        try {
            String response = aiService.ask(prompt);
            return ResponseEntity.ok(Map.of("response", response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Tutor error: " + e.getMessage());
        }
    }
}