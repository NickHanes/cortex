package com.study.cortex.flashcard;

import com.study.cortex.note.Note;
import jakarta.persistence.*;

@Entity
public class Flashcard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String question;

    @Column(length = 1000)
    private String answer;

    @ManyToOne
    @JoinColumn(name = "note_id")
    private Note note;

    public Flashcard() {}

    public Long getId() { return id; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public Note getNote() { return note; }
    public void setNote(Note note) { this.note = note; }
}