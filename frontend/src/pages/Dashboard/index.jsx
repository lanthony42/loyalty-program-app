import "@/pages/main.css";
import "@/pages/card.css";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RecentTransactions from "@/pages/Transactions/Recent";
import UpcomingPromotions from "@/pages/Promotions/Upcoming";
import UpcomingEvents from "@/pages/Events/Upcoming";

const Dashboard = () => {
    const { Role, authReady, user } = useAuth();
    const location = useLocation();

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" state={{ fromPage: location }} replace />;
    }
    
    const isManager = Role[user.role] >= Role.manager;

    return <>
        <h3>Welcome, {user?.name || user?.utorid}!</h3>
        {user.role === "regular" && <>
            <div>
                <h1>Current Point Balance</h1>
                <h1>{user.points}</h1>
            </div>
            <RecentTransactions />
        </>}
        {user.role === "cashier" && (
            <div className="btn-container">
                <Link to="/transactions/process" state={{ fromSite: true }}>Process Redemptions</Link>
                <Link to="/transactions/create" state={{ fromSite: true }}>Create New Transaction</Link>
            </div>
        )}
        {isManager && <>
            <div>
                <h1>Manage Users</h1>
                <div className="btn-container" style={{ display: "flex", justifyContent: "center", padding : "20px" }}>
                    <Link to="/users">Manage</Link>
                </div>
            </div>
            <UpcomingPromotions />
            <UpcomingEvents />
        </>}
    </>;
};

export default Dashboard;
