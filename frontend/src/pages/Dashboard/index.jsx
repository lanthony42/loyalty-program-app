import "@/pages/main.css";
import "@/pages/card.css";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RecentTransactions from "@/pages/Transactions/Recent";
import UpcomingPromotions from "@/pages/Promotions/Upcoming";
import UpcomingEvents from "@/pages/Events/Upcoming";

const Dashboard = () => {
    const { Role, authReady, user } = useAuth();
    const isManager = Role[user.role] >= Role.manager;

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>
        <h2>Welcome, {user?.name || user?.utorid}!</h2>
        {user.role === "regular" && (
            <div>
                <h3>Current Point Balance</h3>
                <h3>{user.points}</h3>
            </div>
        )}
        {user.role === "regular" && (
            <div>
                <RecentTransactions user={user} />
            </div>
        )}
        {user.role === "cashier" && (
            <div>
                <div className="btn-container">
                    <Link to="/transactions/process">Process Redemptions</Link>
                    <Link to="/transactions/create">Create New Transaction</Link>
                </div>
            </div>
        )}
        {isManager && (
            <div>
                <h3>Manage Users</h3>
                <div className="btn-container" style={{ display: "flex", justifyContent: "center", padding : "20px" }}>
                    <Link to="/users">Manage</Link>
                </div>
                <UpcomingPromotions user={user} />
                <UpcomingEvents user={user} />
            </div>
        )}
    </>;
};

export default Dashboard;
