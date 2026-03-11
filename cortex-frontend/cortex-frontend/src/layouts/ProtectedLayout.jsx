import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./layout.css";

function ProtectedLayout() {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Topbar />
                <div className="content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default ProtectedLayout;