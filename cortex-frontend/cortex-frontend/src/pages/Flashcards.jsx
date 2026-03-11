import { useEffect, useState } from "react";
import { Sparkles, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Check, X, BookOpen, RotateCcw } from "lucide-react";
import api from "../api/api";
import "./flashcards.css";

function Flashcards() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [flashcards, setFlashcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [newAnswer, setNewAnswer] = useState("");
    const [editing, setEditing] = useState(false);
    const [editQuestion, setEditQuestion] = useState("");
    const [editAnswer, setEditAnswer] = useState("");

    useEffect(() => {
        api.get("/notes")
            .then(res => setNotes(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error(err));
    }, []);

    const selectNote = async (note) => {
        setSelectedNote(note);
        setCurrentIndex(0);
        setFlipped(false);
        setEditing(false);
        setShowAddForm(false);
        const res = await api.get(`/flashcards/note/${note.id}`);
        setFlashcards(res.data);
    };

    const generateCards = async () => {
        setGenerating(true);
        try {
            const res = await api.post(`/flashcards/note/${selectedNote.id}/generate`);
            setFlashcards(prev => [...prev, ...res.data]);
        } catch (err) {
            console.error(err);
        }
        setGenerating(false);
    };

    const addManual = async () => {
        if (!newQuestion.trim() || !newAnswer.trim()) return;
        const res = await api.post(`/flashcards/note/${selectedNote.id}`, {
            question: newQuestion,
            answer: newAnswer
        });
        setFlashcards(prev => [...prev, res.data]);
        setNewQuestion("");
        setNewAnswer("");
        setShowAddForm(false);
    };

    const deleteCard = async (id) => {
        await api.delete(`/flashcards/${id}`);
        const updated = flashcards.filter(c => c.id !== id);
        setFlashcards(updated);
        setCurrentIndex(prev => Math.min(prev, Math.max(0, updated.length - 1)));
        setFlipped(false);
        setEditing(false);
    };

    const startEdit = () => {
        setEditQuestion(current.question);
        setEditAnswer(current.answer);
        setEditing(true);
    };

    const saveEdit = async () => {
        const res = await api.put(`/flashcards/${current.id}`, {
            question: editQuestion,
            answer: editAnswer
        });
        setFlashcards(flashcards.map(c => c.id === current.id ? res.data : c));
        setEditing(false);
        setFlipped(false);
    };

    const next = () => {
        setFlipped(false);
        setEditing(false);
        setTimeout(() => setCurrentIndex(prev => (prev + 1) % flashcards.length), 150);
    };

    const prev = () => {
        setFlipped(false);
        setEditing(false);
        setTimeout(() => setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length), 150);
    };

    const flipCard = async () => {
        if (!flipped) {
            try {
                await api.post("/progress/log", {
                    type: "FLASHCARD_REVIEWED",
                    value: 1,
                    noteId: selectedNote.id,
                    noteName: selectedNote.title
                });
            } catch (err) {
                console.error(err);
            }
        }
        setFlipped(!flipped);
    };

    const current = flashcards[currentIndex];
    const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

    return (
        <div className="fc-container">

            {/* Header */}
            <div className="fc-header">
                <div>
                    <h1>Flashcards</h1>
                    <p className="fc-subtitle">Select a note to study</p>
                </div>
            </div>

            {/* Note selector */}
            <div className="fc-note-selector">
                {notes.map(note => (
                    <button
                        key={note.id}
                        className={`fc-note-chip ${selectedNote?.id === note.id ? "active" : ""}`}
                        onClick={() => selectNote(note)}
                    >
                        <BookOpen size={13} strokeWidth={2} />
                        {note.title || "Untitled"}
                    </button>
                ))}
            </div>

            {!selectedNote && (
                <div className="fc-empty">
                    <div className="fc-empty-icon">
                        <BookOpen size={36} strokeWidth={1.2} />
                    </div>
                    <p>No Note Selected</p>
                    <span>Pick a note above to view or generate flashcards</span>
                </div>
            )}

            {selectedNote && (
                <div className="fc-workspace">

                    {/* Toolbar */}
                    <div className="fc-toolbar">
                        <div className="fc-toolbar-left">
                            <span className="fc-note-label">{selectedNote.title}</span>
                            {flashcards.length > 0 && (
                                <span className="fc-card-count">{flashcards.length} card{flashcards.length !== 1 ? "s" : ""}</span>
                            )}
                        </div>
                        <div className="fc-toolbar-right">
                            <button
                                className="fc-btn fc-btn-ghost"
                                onClick={() => { setShowAddForm(v => !v); setEditing(false); }}
                            >
                                <Plus size={15} strokeWidth={2.5} />
                                Add
                            </button>
                            <button
                                className="fc-btn fc-btn-primary"
                                onClick={generateCards}
                                disabled={generating}
                            >
                                <Sparkles size={14} strokeWidth={2} />
                                {generating ? "Generating..." : "AI Generate"}
                            </button>
                        </div>
                    </div>

                    {/* Add form */}
                    {showAddForm && (
                        <div className="fc-add-form">
                            <input
                                placeholder="Question..."
                                value={newQuestion}
                                onChange={e => setNewQuestion(e.target.value)}
                                className="fc-input"
                                autoFocus
                            />
                            <input
                                placeholder="Answer..."
                                value={newAnswer}
                                onChange={e => setNewAnswer(e.target.value)}
                                className="fc-input"
                                onKeyDown={e => e.key === "Enter" && addManual()}
                            />
                            <div className="fc-form-actions">
                                <button className="fc-btn fc-btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button className="fc-btn fc-btn-primary" onClick={addManual} disabled={!newQuestion.trim() || !newAnswer.trim()}>
                                    <Check size={14} />
                                    Save Card
                                </button>
                            </div>
                        </div>
                    )}

                    {flashcards.length === 0 ? (
                        <div className="fc-empty fc-empty-inline">
                            <p>No flashcards yet</p>
                            <span>Generate with AI or add them manually above</span>
                        </div>
                    ) : editing ? (
                        /* Edit form */
                        <div className="fc-edit-form">
                            <div className="fc-edit-field">
                                <label>Question</label>
                                <textarea
                                    value={editQuestion}
                                    onChange={e => setEditQuestion(e.target.value)}
                                    className="fc-textarea"
                                />
                            </div>
                            <div className="fc-edit-field">
                                <label>Answer</label>
                                <textarea
                                    value={editAnswer}
                                    onChange={e => setEditAnswer(e.target.value)}
                                    className="fc-textarea"
                                />
                            </div>
                            <div className="fc-form-actions">
                                <button className="fc-btn fc-btn-ghost" onClick={() => setEditing(false)}>
                                    <X size={14} /> Cancel
                                </button>
                                <button className="fc-btn fc-btn-primary" onClick={saveEdit}>
                                    <Check size={14} /> Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Card viewer */
                        <div className="fc-viewer">

                            {/* Progress bar */}
                            <div className="fc-progress-row">
                                <span className="fc-progress-label">{currentIndex + 1} / {flashcards.length}</span>
                                <div className="fc-progress-track">
                                    <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="fc-progress-pct">{Math.round(progress)}%</span>
                            </div>

                            {/* Flip card */}
                            <div className={`fc-card ${flipped ? "flipped" : ""}`} onClick={flipCard}>
                                <div className="fc-card-inner">
                                    <div className="fc-card-front">
                                        <span className="fc-side-label">Question</span>
                                        <p>{current?.question}</p>
                                        <div className="fc-tap-hint">
                                            <RotateCcw size={13} strokeWidth={2} />
                                            tap to reveal
                                        </div>
                                    </div>
                                    <div className="fc-card-back">
                                        <span className="fc-side-label">Answer</span>
                                        <p>{current?.answer}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="fc-controls">
                                <button className="fc-nav-btn" onClick={prev}>
                                    <ChevronLeft size={20} strokeWidth={2} />
                                </button>

                                <div className="fc-center-controls">
                                    <button className="fc-icon-btn fc-edit" onClick={startEdit} title="Edit">
                                        <Pencil size={15} strokeWidth={2} />
                                    </button>
                                    <button className="fc-icon-btn fc-delete" onClick={() => deleteCard(current.id)} title="Delete">
                                        <Trash2 size={15} strokeWidth={2} />
                                    </button>
                                </div>

                                <button className="fc-nav-btn" onClick={next}>
                                    <ChevronRight size={20} strokeWidth={2} />
                                </button>
                            </div>

                            {/* Dot indicators */}
                            <div className="fc-dots">
                                {flashcards.slice(0, Math.min(flashcards.length, 12)).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`fc-dot ${i === currentIndex ? "active" : ""}`}
                                        onClick={() => { setCurrentIndex(i); setFlipped(false); }}
                                    />
                                ))}
                                {flashcards.length > 12 && <span className="fc-dot-more">+{flashcards.length - 12}</span>}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Flashcards;