package com.study.cortex.progress;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class StudyActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Enumerated(EnumType.STRING)
    private ActivityType type;

    private LocalDate date;
    private LocalDateTime timestamp;
    private int value; // score for quiz, minutes for timer, count for flashcards

    private Long noteId;
    private String noteName;

    public enum ActivityType {
        QUIZ_COMPLETED, FLASHCARD_REVIEWED, TIMER_SESSION
    }

    public StudyActivity() {}

    public Long getId() { return id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public int getValue() { return value; }
    public void setValue(int value) { this.value = value; }

    public Long getNoteId() { return noteId; }
    public void setNoteId(Long noteId) { this.noteId = noteId; }

    public String getNoteName() { return noteName; }
    public void setNoteName(String noteName) { this.noteName = noteName; }
}
