import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const Recent = ({ limit = 4 }) => {
    const [transactions, setTransactions] = useState([]);
    const { Role, user } = useAuth();
    const isManager = Role[user.role] >= Role.manager;

    useEffect(() => {
        if (user) {
            fetchRecentTransactions();
        }
    }, [user]);

    const fetchRecentTransactions = async () => {
        try {
            const url = `${config.backendUrl}/users/me/transactions?limit=${limit}`; 
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTransactions(data.results);
            }
            else {
                console.error("Failed to fetch transactions");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    return !transactions ? null : <>
        <div>
            <h3>Recent Transactions</h3>
            <div className="grid-container">
                {transactions.map(transaction => <div key={transaction.id} className={`card ${transaction.type}`}>
                    <div className="card-content">
                        <h4>{transaction.type.toUpperCase()} (ID: {transaction.id})</h4>
                        <p>
                            <strong>Amount:</strong> {transaction.amount}
                        </p>
                        {transaction.type === "purchase" && <p>
                            <strong>Spent:</strong> ${transaction.spent.toFixed(2)}
                        </p>}
                        {transaction.type === "adjustment" && <p>
                            <strong>Related ID:</strong> {transaction.relatedId}
                        </p>}
                        {transaction.type === "redemption" && <p>
                            <strong>Processed:</strong> {transaction.relatedId != null ? "Yes" : "No"}
                        </p>}
                        <p>
                            <strong>Created By:</strong> {transaction.createdBy}
                        </p>
                    </div>
                    <div className="btn-container">
                        {isManager && <Link to={`/transactions/${transaction.id}`} state={{ fromSite: true }}>View</Link>}
                    </div>
                </div>)}
            </div>
        </div>
    </>;
};

export default Recent;
