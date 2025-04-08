import "@/pages/main.css";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
    const { authReady, user } = useAuth();
    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>
        <h2>Welcome!</h2>
        <div className="row">
            <Link to="/login">Login</Link>
        </div>
    </>;
};

export default Home;
