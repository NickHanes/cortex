import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Timer, BookOpen, FileText, Trophy,
    Upload, Brain, ClipboardList, Search,
    Flame, Zap, Calendar, ArrowRight
} from "lucide-react";
import api from "../api/api";
import "./dashboard.css";

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBeginStudying, setShowBeginStudying] = useState(
        !localStorage.getItem("cortex-session-started")
    );
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, notesRes] = await Promise.all([
                    api.get("/progress/stats"),
                    api.get("/notes")
                ]);
                setStats(statsRes.data);
                setNotes(Array.isArray(notesRes.data) ? notesRes.data.slice(0, 4) : []);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const deleteQuizResult = async (id) => {
        await api.delete(`/progress/${id}`);
        setStats(prev => ({
            ...prev,
            quizScores: prev.quizScores.filter(q => q.id !== id)
        }));
    };

    const beginStudying = () => {
        localStorage.setItem("cortex-session-started", "true");
        setShowBeginStudying(false);
        navigate("/timer");
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent("cortex-begin-studying"));
        }, 100);
    };

    if (loading) return (
        <div className="dashboard-loading">
            <div className="loading-orb" />
            <span>Loading your workspace...</span>
        </div>
    );

    const streak = stats?.streak || 0;
    const StreakIcon = streak >= 7 ? Flame : streak >= 3 ? Zap : Calendar;

    const statCards = [
        { Icon: Timer,    value: stats?.minutesStudied || 0,    label: "Minutes Studied",    color: "#6c63ff" },
        { Icon: BookOpen, value: stats?.flashcardsReviewed || 0, label: "Flashcards Reviewed", color: "#2ecc71" },
        { Icon: FileText, value: notes.length,                   label: "Notes",               color: "#f39c12" },
        { Icon: Trophy,   value: stats?.totalSessions || 0,      label: "Timer Sessions",      color: "#e74c3c" },
    ];

    const actions = [
        { label: "Upload Notes",  path: "/handwriting", Icon: Upload        },
        { label: "Flashcards",    path: "/flashcards",  Icon: BookOpen      },
        { label: "Take a Quiz",   path: "/quizzes",     Icon: ClipboardList },
        { label: "AI Tutor",      path: "/ai",          Icon: Brain         },
        { label: "Timer",         path: "/timer",       Icon: Timer         },
        { label: "Resources",     path: "/resources",   Icon: Search        },
    ];

    return (
        <div className="dashboard-container">

            {/* Begin Studying hero */}
            {showBeginStudying && (
                <div className="begin-hero">
                    <div className="begin-hero-glow" />
                    <div className="begin-hero-content">
                        <p className="begin-hero-eyebrow">Ready to focus?</p>
                        <h2 className="begin-hero-title">Start your study session</h2>
                        <p className="begin-hero-sub">Enters focus mode and starts the timer</p>
                        <button className="begin-hero-btn" onClick={beginStudying}>
                            Begin Studying
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Dashboard</h1>
                    <p className="dashboard-subtitle">
                        {stats?.studiedToday
                            ? "You've studied today — great work"
                            : "No study session yet today. Let's change that."}
                    </p>
                </div>
            </div>

            {/* Streak */}
            <div className={`streak-card ${streak > 0 ? "streak-active" : ""}`}>
                <div className="streak-left">
                    <div className="streak-icon-wrap">
                        <StreakIcon size={22} strokeWidth={2} />
                    </div>
                    <div>
                        <div className="streak-number">{streak} <span>day streak</span></div>
                        <div className="streak-msg">{streak >= 1 ? "Keep it going!" : "Study today to start your streak"}</div>
                    </div>
                </div>
                <div className="streak-week">
                    {["M","T","W","T","F","S","S"].map((d, i) => (
                        <div key={i} className={`streak-pip ${i < (streak % 7 || 0) ? "pip-filled" : ""}`}>
                            <div className="pip-dot" />
                            <span>{d}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stat cards */}
            <div className="stats-row">
                {statCards.map(({ Icon, value, label, color }, i) => (
                    <div key={i} className="stat-card" style={{"--accent": color}}>
                        <div className="stat-card-top">
                            <div className="stat-icon-wrap" style={{color}}>
                                <Icon size={18} strokeWidth={2} />
                            </div>
                            <div className="stat-card-glow" />
                        </div>
                        <div className="stat-card-value">{value}</div>
                        <div className="stat-card-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* Two column */}
            <div className="dashboard-cols">
                <div className="dash-panel">
                    <div className="panel-header">
                        <h2>Recent Notes</h2>
                        <button className="panel-link" onClick={() => navigate("/notes")}>View all →</button>
                    </div>
                    <div className="notes-stack">
                        {notes.length === 0 && <p className="empty-hint">No notes yet — upload some to get started.</p>}
                        {notes.map((note, i) => (
                            <div key={note.id} className="note-row" onClick={() => navigate("/notes")} style={{"--i": i}}>
                                <div className="note-row-dot" />
                                <div className="note-row-content">
                                    <span className="note-row-title">{note.title || "Untitled Note"}</span>
                                    <span className="note-row-summary">{note.summary?.slice(0, 60) || "No summary"}...</span>
                                </div>
                                <ArrowRight size={14} className="note-row-arrow" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dash-panel">
                    <div className="panel-header">
                        <h2>Quiz History</h2>
                        <button className="panel-link" onClick={() => navigate("/quizzes")}>Take a quiz →</button>
                    </div>
                    <div className="quiz-stack">
                        {(!stats?.quizScores || stats.quizScores.length === 0) && (
                            <p className="empty-hint">No quizzes yet — test your knowledge!</p>
                        )}
                        {Object.entries(
                            (stats?.quizScores || []).reduce((groups, q) => {
                                const key = q.noteName || "Unknown Note";
                                if (!groups[key]) groups[key] = [];
                                groups[key].push(q);
                                return groups;
                            }, {})
                        ).map(([noteName, scores]) => (
                            <div key={noteName} className="quiz-group">
                                <div className="quiz-group-label">
                                    <span>{noteName}</span>
                                    <span className="quiz-best">Best: {Math.max(...scores.map(s => s.score))}%</span>
                                </div>
                                {scores.map((q, i) => (
                                    <div key={i} className="quiz-row">
                                        <span className="quiz-date">{q.date}</span>
                                        <div className="quiz-row-right">
                                            <div className={`quiz-badge ${q.score >= 80 ? "badge-high" : q.score >= 60 ? "badge-mid" : "badge-low"}`}>
                                                {q.score}%
                                            </div>
                                            <button className="quiz-del" onClick={() => deleteQuizResult(q.id)}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="quick-actions-section">
                <h2>Quick Actions</h2>
                <div className="actions-row">
                    {actions.map(({ label, path, Icon }, i) => (
                        <button key={i} className="action-tile" onClick={() => navigate(path)}>
                            <Icon size={15} strokeWidth={2} className="action-tile-icon" />
                            <span className="action-tile-label">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;