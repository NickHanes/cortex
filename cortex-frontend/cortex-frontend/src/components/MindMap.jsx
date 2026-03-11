import { useEffect, useRef, useState, useCallback } from "react";
import api from "../api/api";
import "./mindmap.css";

const COLORS = [
    "#6c63ff", "#2ecc71", "#e74c3c", "#f39c12",
    "#3498db", "#e91e8c", "#00bcd4", "#ff5722"
];

function MindMap({ note, onClose }) {
    const [nodes, setNodes] = useState([]);
    const [centralTopic, setCentralTopic] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dragging, setDragging] = useState(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(() => {
        const generate = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.post(`/notes/${note.id}/mindmap`);
                const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
                setCentralTopic(data.centralTopic || note.title);

                const container = containerRef.current;
                const W = container ? container.offsetWidth : 900;
                const H = container ? container.offsetHeight : 600;
                const cx = W / 2;
                const cy = H / 2;

                // Build node map
                const nodeMap = { "0": { id: "0", label: data.centralTopic || note.title, parent: null } };
                (data.nodes || []).forEach(n => { nodeMap[n.id] = { ...n }; });

                // Position nodes radially
                const positioned = {};

                // Center node
                positioned["0"] = { ...nodeMap["0"], x: cx, y: cy, depth: 0 };

                // First level children
                const firstLevel = Object.values(nodeMap).filter(n => n.parent === "0");
                const angleStep = (2 * Math.PI) / (firstLevel.length || 1);
                const radius1 = 200;

                firstLevel.forEach((n, i) => {
                    const angle = i * angleStep - Math.PI / 2;
                    positioned[n.id] = {
                        ...n,
                        x: cx + Math.cos(angle) * radius1,
                        y: cy + Math.sin(angle) * radius1,
                        depth: 1,
                        branchColor: COLORS[i % COLORS.length],
                        angle
                    };
                });

                // Second level children
                const secondLevel = Object.values(nodeMap).filter(n =>
                    n.parent !== "0" && positioned[n.parent]
                );

                // Group by parent
                const byParent = {};
                secondLevel.forEach(n => {
                    if (!byParent[n.parent]) byParent[n.parent] = [];
                    byParent[n.parent].push(n);
                });

                Object.entries(byParent).forEach(([parentId, children]) => {
                    const parent = positioned[parentId];
                    const spread = 0.6;
                    const childStep = spread / (children.length + 1);
                    const radius2 = 160;

                    children.forEach((n, i) => {
                        const angle = (parent.angle || 0) + (i + 1) * childStep - spread / 2;
                        positioned[n.id] = {
                            ...n,
                            x: parent.x + Math.cos(angle) * radius2,
                            y: parent.y + Math.sin(angle) * radius2,
                            depth: 2,
                            branchColor: parent.branchColor
                        };
                    });
                });

                // Third level (if any)
                const thirdLevel = Object.values(nodeMap).filter(n =>
                    !positioned[n.id] && positioned[n.parent]
                );

                thirdLevel.forEach((n, i) => {
                    const parent = positioned[n.parent];
                    if (!parent) return;
                    const angle = (parent.angle || 0) + i * 0.4;
                    positioned[n.id] = {
                        ...n,
                        x: parent.x + Math.cos(angle) * 130,
                        y: parent.y + Math.sin(angle) * 130,
                        depth: 3,
                        branchColor: parent.branchColor
                    };
                });

                setNodes(Object.values(positioned));
            } catch (err) {
                setError("Failed to generate mind map. Try again.");
                console.error(err);
            }
            setLoading(false);
        };

        generate();
    }, [note]);

    // Dragging nodes
    const onMouseDownNode = useCallback((e, nodeId) => {
        e.stopPropagation();
        const node = nodes.find(n => n.id === nodeId);
        setDragging(nodeId);
        setOffset({
            x: e.clientX - node.x * zoom - pan.x,
            y: e.clientY - node.y * zoom - pan.y
        });
    }, [nodes, zoom, pan]);

    // Panning canvas
    const onMouseDownCanvas = useCallback((e) => {
        if (dragging) return;
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }, [dragging, pan]);

    const onMouseMove = useCallback((e) => {
        if (dragging) {
            const nx = (e.clientX - offset.x - pan.x) / zoom;
            const ny = (e.clientY - offset.y - pan.y) / zoom;
            setNodes(prev => prev.map(n =>
                n.id === dragging ? { ...n, x: nx, y: ny } : n
            ));
        } else if (isPanning) {
            setPan({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    }, [dragging, isPanning, offset, pan, panStart, zoom]);

    const onMouseUp = useCallback(() => {
        setDragging(null);
        setIsPanning(false);
    }, []);

    const onWheel = useCallback((e) => {
        e.preventDefault();
        setZoom(prev => Math.min(2, Math.max(0.4, prev - e.deltaY * 0.001)));
    }, []);

    // Draw connections
    const connections = nodes
        .filter(n => n.parent && nodes.find(p => p.id === n.parent))
        .map(n => {
            const parent = nodes.find(p => p.id === n.parent);
            return { from: parent, to: n, color: n.branchColor || "#6c63ff" };
        });

    return (
        <div className="mindmap-overlay" onClick={onClose}>
            <div
                className="mindmap-modal"
                onClick={e => e.stopPropagation()}
                ref={containerRef}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}
                onMouseDown={onMouseDownCanvas}
                style={{ cursor: isPanning ? "grabbing" : "grab" }}
            >
                {/* Header */}
                <div className="mindmap-header">
                    <h2>{centralTopic || note.title}</h2>
                    <div className="mindmap-controls">
                        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
                        <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>−</button>
                        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Reset</button>
                        <button className="mindmap-close" onClick={onClose}>✕</button>
                    </div>
                </div>

                {loading && (
                    <div className="mindmap-loading">
                        <div className="mindmap-spinner" />
                        <p>AI is mapping your notes...</p>
                    </div>
                )}

                {error && (
                    <div className="mindmap-error">
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()}>Retry</button>
                    </div>
                )}

                {!loading && !error && (
                    <div
                        className="mindmap-canvas"
                        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
                    >
                        {/* SVG connections */}
                        <svg ref={svgRef} className="mindmap-svg">
                            {connections.map((c, i) => (
                                <line
                                    key={i}
                                    x1={c.from.x}
                                    y1={c.from.y}
                                    x2={c.to.x}
                                    y2={c.to.y}
                                    stroke={c.color}
                                    strokeWidth={c.to.depth === 1 ? 2.5 : 1.5}
                                    strokeOpacity={0.6}
                                />
                            ))}
                        </svg>

                        {/* Nodes */}
                        {nodes.map(node => (
                            <div
                                key={node.id}
                                className={`mindmap-node depth-${node.depth}`}
                                style={{
                                    left: node.x,
                                    top: node.y,
                                    borderColor: node.depth === 0 ? "#6c63ff" : node.branchColor || "#6c63ff",
                                    boxShadow: node.depth === 0
                                        ? `0 0 24px #6c63ff66`
                                        : `0 0 10px ${node.branchColor || "#6c63ff"}44`,
                                    cursor: dragging === node.id ? "grabbing" : "grab"
                                }}
                                onMouseDown={e => onMouseDownNode(e, node.id)}
                            >
                                {node.label}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mindmap-hint">Drag nodes to rearrange · Scroll to zoom · Click outside to close</div>
            </div>
        </div>
    );
}

export default MindMap;