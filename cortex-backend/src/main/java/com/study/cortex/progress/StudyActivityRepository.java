package com.study.cortex.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface StudyActivityRepository extends JpaRepository<StudyActivity, Long> {
    List<StudyActivity> findByUsernameOrderByTimestampDesc(String username);
    List<StudyActivity> findByUsernameAndType(String username, StudyActivity.ActivityType type);
    boolean existsByUsernameAndDate(String username, LocalDate date);
    List<StudyActivity> findByUsernameAndDateOrderByTimestampDesc(String username, LocalDate date);
}