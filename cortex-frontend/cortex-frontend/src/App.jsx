import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedLayout from "./layouts/ProtectedLayout";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Flashcards from "./pages/Flashcards";
import Quizzes from "./pages/Quizzes";
import AI from "./pages/AI";
import Handwriting from "./pages/Handwriting";
import Timer from "./pages/Timer";
import FloatingTimer from "./components/FloatingTimer";
import Resources from "./pages/Resources"

function App() {
    const [timerRunning, setTimerRunning] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [mode, setMode] = useState("study");
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [sessions, setSessions] = useState(0);
    const [customStudy, setCustomStudy] = useState(25);
    const [customBreak, setCustomBreak] = useState(5);
    const intervalRef = useRef(null);
    const deadlineRef = useRef(null);
    const sessionStartRef = useRef(null);

    const playAlert = () => {
        try {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.frequency.value = 880;
            oscillator.type = "sine";
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 1);
        } catch {
            // Audio not supported
        }
    };

    const logMinutes = (elapsedMinutes) => {
        const token = localStorage.getItem("token");
        if (token && elapsedMinutes >= 1) {
            fetch("http://localhost:8080/progress/log", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: "TIMER_SESSION",
                    value: elapsedMinutes
                })
            }).catch(() => {});
        }
    };

    const switchMode = useCallback((newMode) => {
        setMode(newMode);
        setTimerRunning(false);
        deadlineRef.current = null;
        clearInterval(intervalRef.current);
        const mins = newMode === "study" ? customStudy : customBreak;
        setMinutes(mins);
        setSeconds(0);
    }, [customStudy, customBreak]);

    const handleTimerEnd = useCallback(() => {
        clearInterval(intervalRef.current);
        setTimerRunning(false);
        deadlineRef.current = null;
        playAlert();
        if (mode === "study") {
            setSessions(prev => prev + 1);
            switchMode("break");
        } else {
            switchMode("study");
        }
    }, [mode, switchMode]);

    useEffect(() => {
        if (timerRunning) {
            sessionStartRef.current = Date.now();
            const totalMs = (minutes * 60 + seconds) * 1000;
            deadlineRef.current = Date.now() + totalMs;

            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
                const remaining = Math.ceil((deadlineRef.current - Date.now()) / 1000);

                if (remaining <= 0) {
                    setMinutes(0);
                    setSeconds(0);
                    handleTimerEnd();
                    return;
                }

                setMinutes(Math.floor(remaining / 60));
                setSeconds(remaining % 60);
            }, 500);
        } else {
            clearInterval(intervalRef.current);

            // Log elapsed minutes when timer stops manually
            if (sessionStartRef.current && mode === "study") {
                const elapsedMs = Date.now() - sessionStartRef.current;
                const elapsedMinutes = Math.floor(elapsedMs / 60000);
                logMinutes(elapsedMinutes);
                sessionStartRef.current = null;
            }
        }

        return () => clearInterval(intervalRef.current);
    }, [timerRunning]); // eslint-disable-line react-hooks/exhaustive-deps

    // Block tab close in focus mode
    useEffect(() => {
        if (focusMode) {
            window.onbeforeunload = (e) => {
                e.preventDefault();
                e.returnValue = "";
            };
        } else {
            window.onbeforeunload = null;
        }
        return () => { window.onbeforeunload = null; };
    }, [focusMode]);

    const timerProps = {
        timerRunning, setTimerRunning,
        focusMode, setFocusMode,
        mode, setMode: switchMode,
        minutes, setMinutes,
        seconds, setSeconds,
        sessions, setSessions,
        customStudy, setCustomStudy,
        customBreak, setCustomBreak,
    };

    return (
        <Router>
            <Routes>
                {/* Public */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected */}
                <Route element={<ProtectedLayout focusMode={focusMode} />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/flashcards" element={<Flashcards />} />
                    <Route path="/quizzes" element={<Quizzes />} />
                    <Route path="/ai" element={<AI />} />
                    <Route path="/handwriting" element={<Handwriting />} />
                    <Route path="/timer" element={<Timer {...timerProps} />} />
                    <Route path="/resources" element={<Resources />} />
                </Route>
            </Routes>

            {/* Floating timer — only shows when focus mode is on */}
            {focusMode && <FloatingTimer {...timerProps} />}
        </Router>
    );
}

export default App;