import { useEffect, useState } from "react";
import { Search, BookOpen, Youtube, Globe, Lightbulb, Brain, FlaskConical, ChevronDown, Sparkles } from "lucide-react";
import api from "../api/api";
import "./resources.css";

function Resources() {
    const [weakTopics, setWeakTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState("");
    const [customTopic, setCustomTopic] = useState("");
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState([]);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [openHint, setOpenHint] = useState(null);

    useEffect(() => {
        api.get("/notes")
            .then(res => setNotes(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error(err));
        api.get("/resources/weak-topics")
            .then(res => setWeakTopics(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error(err));
    }, []);

    const getRecommendations = async () => {
        const topic = customTopic.trim()
            || selectedTopic
            || notes.find(n => n.id === selectedNoteId)?.title
            || "";
        if (!topic && !selectedNoteId) return;
        setLoading(true);
        setRecommendations(null);
        try {
            const res = await api.post("/resources/recommend", {
                topic: topic || "General study help",
                noteId: selectedNoteId || null
            });
            const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
            setRecommendations(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const openSearch = (query, type) => {
        const url = type === "youtube"
            ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
            : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(url, "_blank");
    };

    const activeTopic = customTopic.trim() || selectedTopic || notes.find(n => n.id === selectedNoteId)?.title || "";
    const canSearch = !!(customTopic.trim() || selectedTopic || selectedNoteId);

    return (
        <div className="rs-container">

            {/* Header */}
            <div className="rs-header">
                <h1>Study Resources</h1>
                <p className="rs-subtitle">Get AI-powered recommendations, strategies, and links for any topic</p>
            </div>

            {/* Config panel */}
            <div className="rs-panel">

                {/* Note context */}
                {notes.length > 0 && (
                    <div className="rs-section">
                        <p className="rs-section-label">
                            <BookOpen size={13} strokeWidth={2} /> Base on a note (optional)
                        </p>
                        <div className="rs-chips">
                            <button
                                className={`rs-chip ${selectedNoteId === null ? "active" : ""}`}
                                onClick={() => setSelectedNoteId(null)}
                            >Any</button>
                            {notes.map(note => (
                                <button
                                    key={note.id}
                                    className={`rs-chip ${selectedNoteId === note.id ? "active" : ""}`}
                                    onClick={() => setSelectedNoteId(note.id)}
                                >
                                    {note.title || "Untitled"}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weak topics */}
                {weakTopics.length > 0 && (
                    <div className="rs-section">
                        <p className="rs-section-label">
                            <Brain size={13} strokeWidth={2} /> Your weak areas
                        </p>
                        <div className="rs-chips">
                            {weakTopics.map((t, i) => (
                                <button
                                    key={i}
                                    className={`rs-chip rs-weak-chip ${selectedTopic === t.topic ? "active" : ""} ${t.averageScore < 60 ? "low" : "mid"}`}
                                    onClick={() => { setSelectedTopic(t.topic); setCustomTopic(""); }}
                                >
                                    {t.topic}
                                    <span className="rs-score">{t.averageScore}%</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom topic + search */}
                <div className="rs-search-row">
                    <div className="rs-input-wrap">
                        <Search size={15} strokeWidth={2} className="rs-input-icon" />
                        <input
                            className="rs-input"
                            type="text"
                            placeholder="Type any topic — e.g. Photosynthesis, Calculus, WW2…"
                            value={customTopic}
                            onChange={e => { setCustomTopic(e.target.value); setSelectedTopic(""); }}
                            onKeyDown={e => e.key === "Enter" && getRecommendations()}
                        />
                    </div>
                    <button
                        className="rs-search-btn"
                        onClick={getRecommendations}
                        disabled={loading || !canSearch}
                    >
                        {loading
                            ? <><span className="rs-spinner" /> Analyzing…</>
                            : <><Sparkles size={15} strokeWidth={2} /> Get Resources</>
                        }
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="rs-loading">
                    <div className="rs-loading-ring" />
                    <p>Finding the best resources for your topic…</p>
                </div>
            )}

            {/* Empty state */}
            {!recommendations && !loading && (
                <div className="rs-empty">
                    <div className="rs-empty-icon"><Lightbulb size={32} strokeWidth={1.3} /></div>
                    <p>Pick a weak topic or type one above</p>
                    <span>AI will suggest key concepts, study techniques, problems, and links</span>
                </div>
            )}

            {/* Results */}
            {recommendations && !loading && (
                <div className="rs-results">
                    <div className="rs-results-header">
                        <Sparkles size={16} strokeWidth={2} />
                        <span>Resources for <strong>{activeTopic}</strong></span>
                    </div>

                    {/* Key Concepts */}
                    {recommendations.keyConcepts?.length > 0 && (
                        <div className="rs-block">
                            <div className="rs-block-title">
                                <Brain size={15} strokeWidth={2} /> Key Concepts
                            </div>
                            <div className="rs-concepts-grid">
                                {recommendations.keyConcepts.map((c, i) => (
                                    <div key={i} className="rs-concept-card">
                                        <strong>{c.concept}</strong>
                                        <p>{c.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Study Techniques */}
                    {recommendations.studyTechniques?.length > 0 && (
                        <div className="rs-block">
                            <div className="rs-block-title">
                                <Lightbulb size={15} strokeWidth={2} /> Study Techniques
                            </div>
                            <div className="rs-list">
                                {recommendations.studyTechniques.map((t, i) => (
                                    <div key={i} className="rs-technique-card">
                                        <strong>{t.technique}</strong>
                                        <p>{t.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Practice Problems */}
                    {recommendations.practiceProblems?.length > 0 && (
                        <div className="rs-block">
                            <div className="rs-block-title">
                                <FlaskConical size={15} strokeWidth={2} /> Practice Problems
                            </div>
                            <div className="rs-list">
                                {recommendations.practiceProblems.map((p, i) => (
                                    <div key={i} className="rs-problem-card">
                                        <p className="rs-problem-text">{p.problem}</p>
                                        <button
                                            className="rs-hint-toggle"
                                            onClick={() => setOpenHint(openHint === i ? null : i)}
                                        >
                                            <ChevronDown size={13} strokeWidth={2.5} className={openHint === i ? "rotated" : ""} />
                                            {openHint === i ? "Hide hint" : "Show hint"}
                                        </button>
                                        {openHint === i && <p className="rs-hint">{p.hint}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* YouTube */}
                    {recommendations.youtubeSearches?.length > 0 && (
                        <div className="rs-block">
                            <div className="rs-block-title">
                                <Youtube size={15} strokeWidth={2} /> YouTube Videos
                            </div>
                            <div className="rs-list">
                                {recommendations.youtubeSearches.map((y, i) => (
                                    <div key={i} className="rs-link-card">
                                        <div className="rs-link-info">
                                            <strong>{y.query}</strong>
                                            <p>{y.reason}</p>
                                        </div>
                                        <button className="rs-open-btn yt" onClick={() => openSearch(y.query, "youtube")}>
                                            <Youtube size={13} strokeWidth={2} /> Search
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Articles */}
                    {recommendations.articleSearches?.length > 0 && (
                        <div className="rs-block">
                            <div className="rs-block-title">
                                <Globe size={15} strokeWidth={2} /> Articles & Reading
                            </div>
                            <div className="rs-list">
                                {recommendations.articleSearches.map((a, i) => (
                                    <div key={i} className="rs-link-card">
                                        <div className="rs-link-info">
                                            <strong>{a.query}</strong>
                                            <p>{a.reason}</p>
                                        </div>
                                        <button className="rs-open-btn web" onClick={() => openSearch(a.query, "article")}>
                                            <Globe size={13} strokeWidth={2} /> Search
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Resources;