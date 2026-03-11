package com.study.cortex.progress;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/progress")
public class ProgressController {

    private final StudyActivityRepository activityRepository;

    public ProgressController(StudyActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    // Log any activity
    @PostMapping("/log")
    public ResponseEntity<?> log(@RequestBody Map<String, Object> body,
                                 Authentication auth) {
        String username = auth.getName();

        StudyActivity activity = new StudyActivity();
        activity.setUsername(username);
        activity.setType(StudyActivity.ActivityType.valueOf((String) body.get("type")));
        activity.setValue(body.get("value") != null ? (Integer) body.get("value") : 0);
        activity.setDate(LocalDate.now());
        activity.setTimestamp(LocalDateTime.now());

        if (body.get("noteId") != null) {
            activity.setNoteId(Long.valueOf(body.get("noteId").toString()));
        }
        if (body.get("noteName") != null) {
            activity.setNoteName((String) body.get("noteName"));
        }

        return ResponseEntity.ok(activityRepository.save(activity));
    }

    // Get full dashboard stats
    @GetMapping("/stats")
    public ResponseEntity<?> getStats(Authentication auth) {
        String username = auth.getName();
        List<StudyActivity> all = activityRepository
                .findByUsernameOrderByTimestampDesc(username);

        // Calculate streak
        int streak = 0;
        LocalDate today = LocalDate.now();
        LocalDate check = today;
        Set<LocalDate> studiedDays = new HashSet<>();
        for (StudyActivity a : all) {
            studiedDays.add(a.getDate());
        }
        while (studiedDays.contains(check)) {
            streak++;
            check = check.minusDays(1);
        }

        // Total flashcards reviewed
        long flashcardsReviewed = all.stream()
                .filter(a -> a.getType() == StudyActivity.ActivityType.FLASHCARD_REVIEWED)
                .mapToInt(StudyActivity::getValue)
                .sum();

        // Total minutes studied
        long minutesStudied = all.stream()
                .filter(a -> a.getType() == StudyActivity.ActivityType.TIMER_SESSION)
                .mapToInt(StudyActivity::getValue)
                .sum();

        // Quiz scores per note
        List<Map<String, Object>> quizScores = new ArrayList<>();
        all.stream()
                .filter(a -> a.getType() == StudyActivity.ActivityType.QUIZ_COMPLETED)
                .forEach(a -> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("id", a.getId());
                    entry.put("noteName", a.getNoteName());
                    entry.put("score", a.getValue());
                    entry.put("date", a.getDate().toString());
                    quizScores.add(entry);
                });

        // Today's activity
        boolean studiedToday = studiedDays.contains(today);

        Map<String, Object> stats = new HashMap<>();
        stats.put("streak", streak);
        stats.put("flashcardsReviewed", flashcardsReviewed);
        stats.put("minutesStudied", minutesStudied);
        stats.put("quizScores", quizScores);
        stats.put("studiedToday", studiedToday);
        long timerSessions = all.stream()
                .filter(a -> a.getType() == StudyActivity.ActivityType.TIMER_SESSION)
                .count();
        stats.put("totalSessions", timerSessions);

        return ResponseEntity.ok(stats);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        StudyActivity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));

        if (!activity.getUsername().equals(auth.getName())) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        activityRepository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }
}