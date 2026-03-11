import "./FloatingTimer.css";
import { Play, Pause, X } from "lucide-react";

function FloatingTimer({ timerRunning, setTimerRunning, mode, minutes, seconds, focusMode, setFocusMode }) {
    const pad = (n) => String(n).padStart(2, "0");
    const isStudy = mode === "study";

    return (
        <div className={`ft-wrap ${isStudy ? "ft-study" : "ft-break"}`}>
            <div className="ft-mode">{isStudy ? "Focus" : "Break"}</div>
            <div className="ft-time">{pad(minutes)}:{pad(seconds)}</div>
            <div className="ft-controls">
                <button className="ft-play" onClick={() => setTimerRunning(prev => !prev)}>
                    {timerRunning ? <Pause size={14} strokeWidth={2.5} /> : <Play size={14} strokeWidth={2.5} />}
                </button>
                <button className="ft-close" onClick={() => setFocusMode(false)}>
                    <X size={13} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

export default FloatingTimer;