import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronUp, Network, FileText } from "lucide-react";
import api from "../api/api";
import MindMap from "../components/MindMap";
import "./notes.css";

function Notes() {
    const [notes, setNotes] = useState([]);
    const [content, setContent] = useState("");
    const [title, setTitle] = useState("");
    const [expandedId, setExpandedId] = useState(null);
    const [editingTitleId, setEditingTitleId] = useState(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [mindMapNote, setMindMapNote] = useState(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        api.get("/notes")
            .then(res => setNotes(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error(err));
    }, []);

    const createNote = async () => {
        if (!content.trim()) return;
        const response = await api.post("/notes", {
            title: title.trim() || "Untitled Note",
            content
        });
        setNotes([response.data, ...notes]);
        setContent("");
        setTitle("");
        setAdding(false);
    };

    const deleteNote = async (id, e) => {
        e.stopPropagation();
        await api.delete(`/notes/${id}`);
        setNotes(notes.filter(note => note.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const startRename = (note, e) => {
        e.stopPropagation();
        setEditingTitleId(note.id);
        setEditingTitle(note.title || "");
    };

    const saveRename = async (id, e) => {
        e.stopPropagation();
        if (!editingTitle.trim()) return;
        await api.put(`/notes/${id}`, { title: editingTitle.trim() });
        setNotes(notes.map(n => n.id === id ? { ...n, title: editingTitle.trim() } : n));
        setEditingTitleId(null);
        setEditingTitle("");
    };

    const cancelRename = (e) => {
        e.stopPropagation();
        setEditingTitleId(null);
        setEditingTitle("");
    };

    const toggleExpand = (id) => {
        if (editingTitleId) return;
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="notes-container">

            {/* Header */}
            <div className="notes-header">
                <div className="notes-header-left">
                    <h1>Notes</h1>
                    <span className="notes-count">{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
                </div>
                <button className="new-note-btn" onClick={() => setAdding(v => !v)}>
                    <Plus size={16} strokeWidth={2.5} />
                    New Note
                </button>
            </div>

            {/* Add note panel */}
            {adding && (
                <div className="add-note-panel">
                    <div className="add-note-panel-inner">
                        <input
                            type="text"
                            placeholder="Note title..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="note-title-field"
                            autoFocus
                        />
                        <textarea
                            placeholder="Write your note here..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="note-content-field"
                        />
                        <div className="add-note-actions">
                            <button className="cancel-note-btn" onClick={() => { setAdding(false); setTitle(""); setContent(""); }}>
                                Cancel
                            </button>
                            <button className="save-note-btn" onClick={createNote} disabled={!content.trim()}>
                                <Check size={14} strokeWidth={2.5} />
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {notes.length === 0 && !adding && (
                <div className="notes-empty">
                    <div className="empty-icon-wrap">
                        <FileText size={32} strokeWidth={1.5} />
                    </div>
                    <p>No notes yet</p>
                    <span>Click "New Note" or upload files to get started</span>
                </div>
            )}

            {/* Notes list */}
            <div className="notes-list">
                {notes.map((note, idx) => (
                    <div
                        key={note.id}
                        className={`note-card ${expandedId === note.id ? "expanded" : ""}`}
                        style={{ "--idx": idx }}
                        onClick={() => toggleExpand(note.id)}
                    >
                        {/* Card accent line */}
                        <div className="note-accent" />

                        <div className="note-header">
                            {editingTitleId === note.id ? (
                                <div className="rename-wrapper" onClick={e => e.stopPropagation()}>
                                    <input
                                        className="rename-field"
                                        value={editingTitle}
                                        onChange={e => setEditingTitle(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") saveRename(note.id, e);
                                            if (e.key === "Escape") cancelRename(e);
                                        }}
                                        autoFocus
                                    />
                                    <button className="icon-btn confirm" onClick={e => saveRename(note.id, e)} title="Save">
                                        <Check size={14} />
                                    </button>
                                    <button className="icon-btn cancel" onClick={cancelRename} title="Cancel">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <h3 className="note-title">{note.title || "Untitled Note"}</h3>
                            )}

                            <div className="note-controls" onClick={e => e.stopPropagation()}>
                                <button className="icon-btn" onClick={e => startRename(note, e)} title="Rename">
                                    <Pencil size={14} />
                                </button>
                                <button className="icon-btn danger" onClick={e => deleteNote(note.id, e)} title="Delete">
                                    <Trash2 size={14} />
                                </button>
                                <div className="expand-btn">
                                    {expandedId === note.id
                                        ? <ChevronUp size={16} strokeWidth={2} />
                                        : <ChevronDown size={16} strokeWidth={2} />
                                    }
                                </div>
                            </div>
                        </div>

                        {expandedId === note.id && (
                            <div className="note-body">
                                {note.summary && (
                                    <div className="note-section">
                                        <div className="section-label">Summary</div>
                                        <p>{note.summary}</p>
                                    </div>
                                )}
                                <div className="note-section">
                                    <div className="section-label">Content</div>
                                    <p>{note.content}</p>
                                </div>
                                <div className="note-body-actions">
                                    <button
                                        className="mindmap-btn"
                                        onClick={e => { e.stopPropagation(); setMindMapNote(note); }}
                                    >
                                        <Network size={15} strokeWidth={2} />
                                        Generate Mind Map
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {mindMapNote && (
                <MindMap note={mindMapNote} onClose={() => setMindMapNote(null)} />
            )}
        </div>
    );
}

export default Notes;