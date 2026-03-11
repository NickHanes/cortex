import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./topbar.css";

function Topbar() {

    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="topbar">
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Topbar;