import "@/pages/main.css";
import "@/pages/card.css";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import RecentTransactions from "@/pages/Transactions/Recent";
import UpcomingPromotions from "@/pages/Promotions/Upcoming";
import UpcomingEvents from "@/pages/Events/Upcoming";

const Dashboard = () => {
    const { Role, authReady, user } = useAuth();

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
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
                <Link to="/transactions/process">Process Redemptions</Link>
                <Link to="/transactions/create">Create New Transaction</Link>
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
