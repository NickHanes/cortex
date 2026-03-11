package com.study.cortex.flashcard;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    List<Flashcard> findByNoteId(Long noteId);
    void deleteByNoteId(Long noteId);
}