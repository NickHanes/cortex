import { useEffect, useState } from "react";
import { Sparkles, Plus, ChevronRight, Trash2, RotateCcw, ArrowLeft, ClipboardList, CheckCircle, XCircle } from "lucide-react";
import api from "../api/api";
import "./quizzes.css";

function Quizzes() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [results, setResults] = useState([]);

    const [newQuestion, setNewQuestion] = useState("");
    const [newType, setNewType] = useState("MULTIPLE_CHOICE");
    const [newOptions, setNewOptions] = useState(["", "", "", ""]);
    const [newCorrect, setNewCorrect] = useState("");

    const optionLabels = ["A", "B", "C", "D"];

    useEffect(() => {
        api.get("/notes")
            .then(res => setNotes(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error(err));
    }, []);

    const selectNote = async (note) => {
        setSelectedNote(note);
        resetQuiz();
        const res = await api.get(`/quiz/note/${note.id}`);
        setQuestions(res.data);
    };

    const resetQuiz = () => {
        setQuizStarted(false);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setAnswered(false);
        setScore(0);
        setQuizFinished(false);
        setResults([]);
    };

    const generateQuiz = async () => {
        setGenerating(true);
        try {
            const res = await api.post(`/quiz/note/${selectedNote.id}/generate`);
            setQuestions(prev => [...prev, ...res.data]);
        } catch (err) {
            console.error(err);
        }
        setGenerating(false);
    };

    const startQuiz = () => {
        resetQuiz();
        setQuizStarted(true);
    };

    const handleAnswer = (option) => {
        if (answered) return;
        setSelectedAnswer(option);
        setAnswered(true);
        const correct = option === questions[currentIndex].correctAnswer;
        if (correct) setScore(prev => prev + 1);
        setResults(prev => [...prev, {
            question: questions[currentIndex].question,
            selected: option,
            correct: questions[currentIndex].correctAnswer,
            isCorrect: correct
        }]);
    };

    const nextQuestion = async () => {
        if (currentIndex + 1 >= questions.length) {
            setQuizFinished(true);
            const correctCount = results.filter(r => r.isCorrect).length;
            const finalScore = Math.round((correctCount / questions.length) * 100);
            try {
                await api.post(`/quiz/note/${selectedNote.id}/complete`, { score: finalScore });
            } catch (err) {
                console.error(err);
            }
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setAnswered(false);
        }
    };

    const deleteQuestion = async (id) => {
        await api.delete(`/quiz/${id}`);
        setQuestions(questions.filter(q => q.id !== id));
    };

    const addManual = async () => {
        if (!newQuestion.trim() || !newCorrect.trim()) return;
        const options = newType === "TRUE_FALSE"
            ? ["True", "False"]
            : newOptions.filter(o => o.trim());
        const res = await api.post(`/quiz/note/${selectedNote.id}`, {
            question: newQuestion, type: newType, options, correctAnswer: newCorrect
        });
        setQuestions(prev => [...prev, res.data]);
        setNewQuestion(""); setNewOptions(["", "", "", ""]); setNewCorrect("");
        setShowAddForm(false);
    };

    const getOptionClass = (option) => {
        if (!answered) return "qz-option";
        if (option === questions[currentIndex].correctAnswer) return "qz-option correct";
        if (option === selectedAnswer) return "qz-option wrong";
        return "qz-option";
    };

    const current = questions[currentIndex];
    const progressPct = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
    const finalScore = Math.round((results.filter(r => r.isCorrect).length / questions.length) * 100);

    return (
        <div className="qz-container">

            {/* Header */}
            <div className="qz-header">
                <h1>Quizzes</h1>
                <p className="qz-subtitle">Select a note to get started</p>
            </div>

            {/* Note selector */}
            <div className="qz-note-selector">
                {notes.map(note => (
                    <button
                        key={note.id}
                        className={`qz-note-chip ${selectedNote?.id === note.id ? "active" : ""}`}
                        onClick={() => selectNote(note)}
                    >
                        <ClipboardList size={13} strokeWidth={2} />
                        {note.title || "Untitled"}
                    </button>
                ))}
            </div>

            {!selectedNote && (
                <div className="qz-empty">
                    <div className="qz-empty-icon"><ClipboardList size={36} strokeWidth={1.2} /></div>
                    <p>No Note Selected</p>
                    <span>Pick a note above to view or generate a quiz</span>
                </div>
            )}

            {/* Question bank view */}
            {selectedNote && !quizStarted && !quizFinished && (
                <div className="qz-bank">

                    {/* Toolbar */}
                    <div className="qz-toolbar">
                        <div className="qz-toolbar-left">
                            <span className="qz-note-label">{selectedNote.title}</span>
                            {questions.length > 0 && (
                                <span className="qz-q-count">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
                            )}
                        </div>
                        <div className="qz-toolbar-right">
                            <button className="qz-btn qz-btn-ghost" onClick={() => setShowAddForm(v => !v)}>
                                <Plus size={15} strokeWidth={2.5} /> Add
                            </button>
                            <button className="qz-btn qz-btn-secondary" onClick={generateQuiz} disabled={generating}>
                                <Sparkles size={14} strokeWidth={2} />
                                {generating ? "Generating..." : "AI Generate"}
                            </button>
                            {questions.length > 0 && (
                                <button className="qz-btn qz-btn-primary" onClick={startQuiz}>
                                    Start Quiz <ChevronRight size={15} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Add form */}
                    {showAddForm && (
                        <div className="qz-add-form">
                            <div className="qz-form-field">
                                <label>Question</label>
                                <textarea
                                    placeholder="Enter your question..."
                                    value={newQuestion}
                                    onChange={e => setNewQuestion(e.target.value)}
                                    className="qz-textarea"
                                />
                            </div>
                            <div className="qz-form-row">
                                <div className="qz-form-field">
                                    <label>Type</label>
                                    <select value={newType} onChange={e => setNewType(e.target.value)} className="qz-select">
                                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                        <option value="TRUE_FALSE">True / False</option>
                                    </select>
                                </div>
                            </div>
                            {newType === "MULTIPLE_CHOICE" && (
                                <div className="qz-form-field">
                                    <label>Options</label>
                                    <div className="qz-options-inputs">
                                        {newOptions.map((opt, i) => (
                                            <div key={i} className="qz-option-input-wrap">
                                                <span className="qz-option-letter">{optionLabels[i]}</span>
                                                <input
                                                    placeholder={`Option ${optionLabels[i]}`}
                                                    value={opt}
                                                    onChange={e => {
                                                        const updated = [...newOptions];
                                                        updated[i] = e.target.value;
                                                        setNewOptions(updated);
                                                    }}
                                                    className="qz-input"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="qz-form-field">
                                <label>Correct Answer</label>
                                <input
                                    placeholder="Must match one of the options exactly..."
                                    value={newCorrect}
                                    onChange={e => setNewCorrect(e.target.value)}
                                    className="qz-input"
                                />
                            </div>
                            <div className="qz-form-actions">
                                <button className="qz-btn qz-btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button className="qz-btn qz-btn-secondary" onClick={addManual}>Save Question</button>
                            </div>
                        </div>
                    )}

                    {questions.length === 0 ? (
                        <div className="qz-empty qz-empty-inline">
                            <p>No Questions Yet</p>
                            <span>Generate with AI or add them manually above</span>
                        </div>
                    ) : (
                        <div className="qz-question-list">
                            {questions.map((q, i) => (
                                <div key={q.id} className="qz-question-row">
                                    <span className="qz-q-num">{i + 1}</span>
                                    <span className={`qz-type-badge ${q.type === "TRUE_FALSE" ? "tf" : "mc"}`}>
                                        {q.type === "TRUE_FALSE" ? "T/F" : "MC"}
                                    </span>
                                    <p className="qz-q-text">{q.question}</p>
                                    <button className="qz-del-btn" onClick={() => deleteQuestion(q.id)}>
                                        <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Active quiz */}
            {quizStarted && !quizFinished && current && (
                <div className="qz-active">
                    <div className="qz-progress-row">
                        <span className="qz-progress-label">{currentIndex + 1} / {questions.length}</span>
                        <div className="qz-progress-track">
                            <div className="qz-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="qz-score-label">Score: {score}</span>
                    </div>

                    <div className="qz-question-card">
                        <span className={`qz-type-badge ${current.type === "TRUE_FALSE" ? "tf" : "mc"}`}>
                            {current.type === "TRUE_FALSE" ? "True / False" : "Multiple Choice"}
                        </span>
                        <h2>{current.question}</h2>
                    </div>

                    <div className="qz-options-grid">
                        {current.options.map((option, i) => (
                            <button
                                key={i}
                                className={getOptionClass(option)}
                                onClick={() => handleAnswer(option)}
                                disabled={answered}
                            >
                                <span className="qz-option-label">{optionLabels[i]}</span>
                                <span className="qz-option-text">{option}</span>
                            </button>
                        ))}
                    </div>

                    {answered && (
                        <div className={`qz-feedback ${selectedAnswer === current.correctAnswer ? "fb-correct" : "fb-wrong"}`}>
                            <div className="qz-feedback-left">
                                {selectedAnswer === current.correctAnswer
                                    ? <><CheckCircle size={18} strokeWidth={2} /> Correct!</>
                                    : <><XCircle size={18} strokeWidth={2} /> Incorrect — correct answer: <strong>{current.correctAnswer}</strong></>
                                }
                            </div>
                            <button className="qz-btn qz-btn-secondary" onClick={nextQuestion}>
                                {currentIndex + 1 >= questions.length ? "See Results" : "Next"} <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {quizFinished && (
                <div className="qz-results">
                    <div className={`qz-score-ring ${finalScore >= 80 ? "ring-high" : finalScore >= 60 ? "ring-mid" : "ring-low"}`}>
                        <span className="qz-score-pct">{finalScore}%</span>
                        <span className="qz-score-frac">{results.filter(r => r.isCorrect).length} / {questions.length}</span>
                    </div>

                    <div className="qz-score-msg">
                        {finalScore >= 80 ? "Excellent work!" : finalScore >= 60 ? "Good effort!" : "Keep studying!"}
                    </div>

                    <div className="qz-results-list">
                        {results.map((r, i) => (
                            <div key={i} className={`qz-result-row ${r.isCorrect ? "r-correct" : "r-wrong"}`}>
                                <div className="qz-result-icon">
                                    {r.isCorrect
                                        ? <CheckCircle size={16} strokeWidth={2} />
                                        : <XCircle size={16} strokeWidth={2} />}
                                </div>
                                <div className="qz-result-content">
                                    <p className="qz-result-q">{i + 1}. {r.question}</p>
                                    <p className="qz-result-a">
                                        Your answer: <strong>{r.selected}</strong>
                                        {!r.isCorrect && <span> · Correct: <strong>{r.correct}</strong></span>}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="qz-results-actions">
                        <button className="qz-btn qz-btn-ghost" onClick={resetQuiz}>
                            <ArrowLeft size={15} /> Back
                        </button>
                        <button className="qz-btn qz-btn-primary" onClick={startQuiz}>
                            <RotateCcw size={14} /> Retry Quiz
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Quizzes;