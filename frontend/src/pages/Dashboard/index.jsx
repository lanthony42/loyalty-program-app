import "@/pages/main.css";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RecentTransactions from "@/pages/Transactions/RecentTransactions";

const Dashboard = () => {
    const { authReady, user } = useAuth();
    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>
        <h2>Welcome, {user?.name || user?.utorid}!</h2>
        {["regular"].includes(user.role) && (
            <div>
                <h3>Current Point Balance</h3>
                <h3>{user.points}</h3>
            </div>
        )}
        {["regular"].includes(user.role) && (
            <div>
                <RecentTransactions user={user} /> 
            </div>
        )}
    </>;
};

export default Dashboard;
