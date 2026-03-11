package com.study.cortex.document;

import com.study.cortex.note.Note;
import com.study.cortex.note.NoteRepository;
import com.study.cortex.service.OCRService;
import com.study.cortex.service.StudyAIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

import java.nio.file.*;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final OCRService ocrService;
    private final StudyAIService studyAIService;
    private final NoteRepository noteRepository;

    public DocumentController(OCRService ocrService,
                              StudyAIService studyAIService,
                              NoteRepository noteRepository) {
        this.ocrService = ocrService;
        this.studyAIService = studyAIService;
        this.noteRepository = noteRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("files") List<MultipartFile> files) {
        try {
            StringBuilder combinedText = new StringBuilder();
            String firstName = files.get(0).getOriginalFilename();

            for (MultipartFile file : files) {
                String pageText = ocrService.extractText(file);
                combinedText.append("=== ").append(file.getOriginalFilename()).append(" ===\n");
                combinedText.append(pageText).append("\n\n");
            }

            var aiResult = studyAIService.processStudyMaterial(combinedText.toString());

            String correctedText = (aiResult != null && aiResult.has("corrected_text"))
                    ? aiResult.get("corrected_text").asText() : combinedText.toString();
            String summary = (aiResult != null && aiResult.has("summary"))
                    ? aiResult.get("summary").asText() : "No summary available";

            Note note = new Note();
            note.setTitle(firstName);
            note.setContent(correctedText);
            note.setSummary(summary);

            return ResponseEntity.ok(noteRepository.save(note));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Upload failed: " + e.getMessage());
        }
    }
}