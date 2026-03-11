import "./timer.css";
import { useEffect, useState } from "react";
import { Lock, Unlock, Settings, RotateCcw, SkipForward, Play, Pause, Check } from "lucide-react";

function Timer({
                   timerRunning, setTimerRunning,
                   focusMode, setFocusMode,
                   mode, setMode,
                   minutes, seconds,
                   sessions,
                   customStudy, setCustomStudy,
                   customBreak, setCustomBreak,
               }) {
    const [showSettings, setShowSettings] = useState(false);
    const [draftStudy, setDraftStudy] = useState(customStudy);
    const [draftBreak, setDraftBreak] = useState(customBreak);
    const pad = (n) => String(n).padStart(2, "0");

    const totalSeconds = mode === "study" ? customStudy * 60 : customBreak * 60;
    const elapsed = totalSeconds - (minutes * 60 + seconds);
    const progress = (elapsed / totalSeconds) * 100;
    const circumference = 2 * Math.PI * 90;
    const strokeDash = circumference - (progress / 100) * circumference;
    const accentColor = mode === "study" ? "#6c63ff" : "#2ecc71";

    const resetTimer = () => { setTimerRunning(false); setMode(mode); };

    const enterFocus = () => {
        document.documentElement.requestFullscreen().catch(() => {});
        setFocusMode(true);
    };

    const exitFocus = () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setFocusMode(false);
    };

    const applySettings = () => {
        setCustomStudy(draftStudy);
        setCustomBreak(draftBreak);
        setShowSettings(false);
        setMode(mode);
    };

    useEffect(() => {
        setDraftStudy(customStudy);
        setDraftBreak(customBreak);
    }, [customStudy, customBreak]);

    useEffect(() => {
        const handler = () => {
            setTimerRunning(true);
            setFocusMode(true);
            document.documentElement.requestFullscreen?.().catch(() => {});
        };
        window.addEventListener("cortex-begin-studying", handler);
        return () => window.removeEventListener("cortex-begin-studying", handler);
    }, [setTimerRunning, setFocusMode]);

    const motivationText = () => {
        if (mode === "break") return "Great work — take a breather";
        if (timerRunning) return "Stay focused, you've got this";
        if (sessions > 0) return `${sessions} session${sessions !== 1 ? "s" : ""} done — keep it up`;
        return "Ready to focus? Let's go";
    };

    return (
        <div className={`tmr-container ${focusMode ? "focus-mode" : ""}`}>

            {focusMode && (
                <div className="tmr-focus-overlay">
                    <button className="tmr-exit-focus" onClick={exitFocus}>
                        <Unlock size={14} strokeWidth={2} /> Exit Focus
                    </button>
                </div>
            )}

            <div className="tmr-inner">

                {/* Header */}
                {!focusMode && (
                    <div className="tmr-header">
                        <div>
                            <h1>Study Timer</h1>
                            <p className="tmr-subtitle">Pomodoro-style focus sessions</p>
                        </div>
                        <div className="tmr-header-actions">
                            <button className="tmr-btn tmr-btn-ghost" onClick={focusMode ? exitFocus : enterFocus}>
                                {focusMode ? <Unlock size={14} /> : <Lock size={14} />}
                                {focusMode ? "Exit Focus" : "Focus Mode"}
                            </button>
                            <button
                                className={`tmr-btn tmr-btn-ghost ${showSettings ? "active" : ""}`}
                                onClick={() => setShowSettings(v => !v)}
                            >
                                <Settings size={14} strokeWidth={2} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Settings panel */}
                {showSettings && !focusMode && (
                    <div className="tmr-settings">
                        <p className="tmr-settings-title">Customize Timer</p>
                        <div className="tmr-settings-row">
                            <label>Study duration</label>
                            <div className="tmr-settings-input-wrap">
                                <input
                                    type="number" min="1" max="120"
                                    value={draftStudy}
                                    onChange={e => setDraftStudy(Number(e.target.value))}
                                    className="tmr-input"
                                />
                                <span>min</span>
                            </div>
                        </div>
                        <div className="tmr-settings-row">
                            <label>Break duration</label>
                            <div className="tmr-settings-input-wrap">
                                <input
                                    type="number" min="1" max="60"
                                    value={draftBreak}
                                    onChange={e => setDraftBreak(Number(e.target.value))}
                                    className="tmr-input"
                                />
                                <span>min</span>
                            </div>
                        </div>
                        <button className="tmr-apply-btn" onClick={applySettings}>
                            <Check size={14} /> Apply
                        </button>
                    </div>
                )}

                {/* Mode tabs */}
                <div className="tmr-mode-tabs">
                    <button
                        className={`tmr-mode-tab ${mode === "study" ? "active study" : ""}`}
                        onClick={() => setMode("study")}
                    >Study</button>
                    <button
                        className={`tmr-mode-tab ${mode === "break" ? "active brk" : ""}`}
                        onClick={() => setMode("break")}
                    >Break</button>
                </div>

                {/* Circle */}
                <div className="tmr-circle-wrap">
                    <svg className="tmr-svg" viewBox="0 0 200 200">
                        <circle cx="100" cy="100" r="90" fill="none" stroke="#252538" strokeWidth="7" />
                        <circle
                            cx="100" cy="100" r="90" fill="none"
                            stroke={accentColor}
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDash}
                            transform="rotate(-90 100 100)"
                            style={{ transition: "stroke-dashoffset 1s linear" }}
                        />
                    </svg>
                    <div className="tmr-display">
                        <span className="tmr-time">{pad(minutes)}:{pad(seconds)}</span>
                        <span className="tmr-label">{mode === "study" ? "Focus Time" : "Break Time"}</span>
                    </div>
                    {/* Glow */}
                    <div className="tmr-glow" style={{ background: accentColor }} />
                </div>

                {/* Controls */}
                <div className="tmr-controls">
                    <button className="tmr-icon-btn" onClick={resetTimer} title="Reset">
                        <RotateCcw size={18} strokeWidth={2} />
                    </button>
                    <button
                        className={`tmr-play-btn ${timerRunning ? "pause" : ""} ${mode}`}
                        onClick={() => setTimerRunning(prev => !prev)}
                    >
                        {timerRunning ? <Pause size={22} strokeWidth={2} /> : <Play size={22} strokeWidth={2} />}
                    </button>
                    <button className="tmr-icon-btn" onClick={() => setMode(mode === "study" ? "break" : "study")} title="Skip">
                        <SkipForward size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* Sessions */}
                <div className="tmr-sessions">
                    <p className="tmr-sessions-label">Sessions today</p>
                    <div className="tmr-dots">
                        {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
                            <div key={i} className={`tmr-dot ${i < sessions ? "done" : ""}`} />
                        ))}
                    </div>
                    <span className="tmr-sessions-count" style={{ color: accentColor }}>
                        {sessions} session{sessions !== 1 ? "s" : ""}
                    </span>
                </div>

                <p className="tmr-motivation">{motivationText()}</p>

            </div>
        </div>
    );
}

export default Timer;