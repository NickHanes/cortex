import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    BookOpen,
    ClipboardList,
    Bot,
    Upload,
    Timer,
    Search
} from "lucide-react";
import "./sidebar.css";

const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/notes", label: "Notes", icon: FileText },
    { path: "/flashcards", label: "Flashcards", icon: BookOpen },
    { path: "/quizzes", label: "Quizzes", icon: ClipboardList },
    { path: "/ai", label: "AI Tutor", icon: Bot },
    { path: "/handwriting", label: "Upload", icon: Upload },
    { path: "/timer", label: "Timer", icon: Timer },
    { path: "/resources", label: "Resources", icon: Search },
];

function Sidebar() {
    const location = useLocation();

    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-mark">⬡</div>
                <span className="logo-text">Cortex</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive ? "active" : ""}`}
                        >
                            <Icon size={17} className="nav-icon" strokeWidth={isActive ? 2.5 : 1.8} />
                            <span className="nav-label">{item.label}</span>
                            {isActive && <span className="active-indicator" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="footer-text">Cortex v1.0</div>
                <div className="footer-sub">AI Study Platform</div>
            </div>
        </div>
    );
}

export default Sidebar;