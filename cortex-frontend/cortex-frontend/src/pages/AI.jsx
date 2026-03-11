import { useEffect, useState, useRef } from "react";
import { Bot, BookOpen, ArrowLeft, Send, RotateCcw } from "lucide-react";
import api from "../api/api";
import "./ai.css";

function AI() {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        api.get("/notes")
            .then(res => setNotes(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const selectNote = async (note) => {
        setSelectedNote(note);
        setMessages([]);
        setLoading(true);
        try {
            const res = await api.post("/tutor/chat", {
                noteId: note.id,
                message: "Hello! I'm ready to study. Please start by introducing the topic and asking me a question.",
                history: []
            });
            setMessages([{ role: "assistant", content: res.data.response }]);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMessage = { role: "user", content: input };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);
        try {
            const res = await api.post("/tutor/chat", {
                noteId: selectedNote.id,
                message: input,
                history: messages
            });
            setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error. Please try again!" }]);
        }
        setLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetSession = () => {
        setMessages([]);
        setSelectedNote(null);
    };

    const restartSession = () => {
        if (selectedNote) selectNote(selectedNote);
    };

    return (
        <div className="ai-container">

            {/* Header */}
            <div className="ai-header">
                <div className="ai-header-left">
                    <h1>AI Tutor</h1>
                    {selectedNote
                        ? <p className="ai-subtitle">
                            <BookOpen size={13} strokeWidth={2} />
                            {selectedNote.title || "Untitled Note"}
                        </p>
                        : <p className="ai-subtitle">Select a note to begin a session</p>
                    }
                </div>
                {selectedNote && (
                    <div className="ai-header-actions">
                        <button className="ai-btn ai-btn-ghost" onClick={restartSession} title="Restart session">
                            <RotateCcw size={14} strokeWidth={2} /> Restart
                        </button>
                        <button className="ai-btn ai-btn-ghost" onClick={resetSession}>
                            <ArrowLeft size={14} strokeWidth={2} /> Change Note
                        </button>
                    </div>
                )}
            </div>

            {/* Note picker */}
            {!selectedNote && (
                <div className="ai-picker">
                    {notes.length === 0 ? (
                        <div className="ai-empty">
                            <div className="ai-empty-icon"><Bot size={36} strokeWidth={1.2} /></div>
                            <p>No notes found</p>
                            <span>Upload some notes first to start a tutoring session</span>
                        </div>
                    ) : (
                        <div className="ai-note-grid">
                            {notes.map(note => (
                                <div key={note.id} className="ai-note-card" onClick={() => selectNote(note)}>
                                    <div className="ai-note-card-icon">
                                        <BookOpen size={18} strokeWidth={1.8} />
                                    </div>
                                    <div className="ai-note-card-body">
                                        <h3>{note.title || "Untitled Note"}</h3>
                                        <p>{note.summary?.slice(0, 90) || "No summary available"}...</p>
                                    </div>
                                    <div className="ai-note-card-cta">
                                        Start Session <Send size={12} strokeWidth={2.5} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Chat */}
            {selectedNote && (
                <div className="ai-chat-wrapper">
                    <div className="ai-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`ai-message ${msg.role === "user" ? "ai-msg-user" : "ai-msg-tutor"}`}>
                                {msg.role === "assistant" && (
                                    <div className="ai-avatar tutor-av">
                                        <Bot size={16} strokeWidth={2} />
                                    </div>
                                )}
                                <div className="ai-bubble">
                                    {msg.content}
                                </div>
                                {msg.role === "user" && (
                                    <div className="ai-avatar user-av">
                                        <span>U</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="ai-message ai-msg-tutor">
                                <div className="ai-avatar tutor-av">
                                    <Bot size={16} strokeWidth={2} />
                                </div>
                                <div className="ai-bubble ai-typing">
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="ai-input-bar">
                        <textarea
                            ref={textareaRef}
                            className="ai-input"
                            placeholder="Type your answer… (Enter to send, Shift+Enter for new line)"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            rows={2}
                        />
                        <button
                            className="ai-send-btn"
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                        >
                            <Send size={16} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AI;