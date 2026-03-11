package com.study.cortex.quiz;

import com.study.cortex.note.Note;
import jakarta.persistence.*;
import java.util.List;

@Entity
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String question;

    @Enumerated(EnumType.STRING)
    private QuestionType type; // MULTIPLE_CHOICE or TRUE_FALSE

    @ElementCollection
    @CollectionTable(name = "quiz_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text", length = 500)
    private List<String> options; // for multiple choice

    @Column(length = 1000)
    private String correctAnswer;

    @ManyToOne
    @JoinColumn(name = "note_id")
    private Note note;

    public enum QuestionType {
        MULTIPLE_CHOICE, TRUE_FALSE
    }

    public QuizQuestion() {}

    public Long getId() { return id; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public QuestionType getType() { return type; }
    public void setType(QuestionType type) { this.type = type; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }

    public Note getNote() { return note; }
    public void setNote(Note note) { this.note = note; }
}