import { useState, useRef } from "react";
import { Upload, FileText, X, Sparkles, CheckCircle, Image, FileUp } from "lucide-react";
import api from "../api/api";
import "./handwriting.css";

function Handwriting() {
    const [files, setFiles] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const addFiles = (incoming) => {
        const arr = Array.from(incoming);
        setFiles(prev => {
            const existing = new Set(prev.map(f => f.name + f.size));
            return [...prev, ...arr.filter(f => !existing.has(f.name + f.size))];
        });
        setResult(null);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setLoading(true);
        try {
            const formData = new FormData();
            files.forEach(file => formData.append("files", file));
            const res = await api.post("/documents/upload", formData);
            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert("Upload failed: " + err.message);
        }
        setLoading(false);
    };

    const isPdf = (name) => name.toLowerCase().endsWith(".pdf");

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    return (
        <div className="up-container">

            <div className="up-header">
                <h1>Upload Notes</h1>
                <p className="up-subtitle">Upload images or PDFs to extract and analyze your notes</p>
            </div>

            {/* Drop zone */}
            <div
                className={`up-dropzone ${dragOver ? "dragover" : ""} ${files.length > 0 ? "has-files" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={e => addFiles(e.target.files)}
                />
                <div className="up-dropzone-icon">
                    <FileUp size={28} strokeWidth={1.5} />
                </div>
                <p className="up-dropzone-title">
                    {dragOver ? "Drop files here" : "Click to browse or drag & drop"}
                </p>
                <p className="up-dropzone-hint">JPG, PNG, or multi-page PDF · Max 50MB per file</p>
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="up-file-list">
                    {files.map((f, i) => (
                        <div key={i} className="up-file-row">
                            <div className="up-file-icon">
                                {isPdf(f.name)
                                    ? <FileText size={16} strokeWidth={2} />
                                    : <Image size={16} strokeWidth={2} />}
                            </div>
                            <div className="up-file-info">
                                <span className="up-file-name">{f.name}</span>
                                <span className="up-file-size">{formatSize(f.size)}</span>
                            </div>
                            <button className="up-file-remove" onClick={() => removeFile(i)}>
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload button */}
            <div className="up-actions">
                {files.length > 0 && (
                    <button className="up-clear-btn" onClick={() => { setFiles([]); setResult(null); }}>
                        Clear all
                    </button>
                )}
                <button
                    className="up-upload-btn"
                    onClick={handleUpload}
                    disabled={loading || files.length === 0}
                >
                    {loading ? (
                        <><span className="up-spinner" /> Processing...</>
                    ) : (
                        <><Sparkles size={15} strokeWidth={2} /> Upload & Analyze</>
                    )}
                </button>
            </div>

            {/* Result */}
            {result && (
                <div className="up-result">
                    <div className="up-result-header">
                        <CheckCircle size={18} strokeWidth={2} />
                        <span>Analysis complete</span>
                    </div>

                    <div className="up-result-card">
                        <div className="up-result-label">Summary</div>
                        <p>{result.summary}</p>
                    </div>

                    <div className="up-result-card">
                        <div className="up-result-label">Extracted & Corrected Text</div>
                        <p className="up-result-content">{result.content}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Handwriting;