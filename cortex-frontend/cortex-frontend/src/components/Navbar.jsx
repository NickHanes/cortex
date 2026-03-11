import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("cortex-session-started");
        navigate("/");
    };

    return (
        <div style={styles.nav}>
            <div style={styles.logo}>Cortex</div>

            <div style={styles.links}>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/notes">Notes</Link>
                <Link to="/flashcards">Flashcards</Link>
                <Link to="/quizzes">Quizzes</Link>
                <Link to="/ai">AI Tutor</Link>
                <Link to="/handwriting">Handwriting</Link>
                <Link to="/timer">Timer</Link>
                <Link to="/resources">Resources</Link>
            </div>

            <button onClick={logout} style={styles.logout}>
                Logout
            </button>
        </div>
    );
}

const styles = {
    nav: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#111",
        color: "white"
    },
    logo: {
        fontWeight: "bold",
        fontSize: "20px"
    },
    links: {
        display: "flex",
        gap: "15px"
    },
    logout: {
        backgroundColor: "red",
        color: "white",
        border: "none",
        padding: "6px 10px",
        cursor: "pointer"
    }
};

export default Navbar;