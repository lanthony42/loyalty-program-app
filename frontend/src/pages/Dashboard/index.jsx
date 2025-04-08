import "@/pages/main.css";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
    const { authReady, user } = useAuth();
    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>
        <h2>Welcome!</h2>
    </>;
};

export default Dashboard;
