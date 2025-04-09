import "./style.css";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Card = ({ transaction }) => {
    const { Role, user } = useAuth();
    const isManager = Role[user.role] >= Role.manager;

    return <>
        <div className={`card ${transaction.type}`}>
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
                {isManager && <p>
                    <strong>Received By:</strong> {transaction.utorid}
                </p>}
                {isManager && <p>
                    <strong>Suspicious:</strong> {transaction.suspicious ? "Yes" : "No"}
                </p>}
                {transaction.remark && <p>
                    <strong>Remark:</strong> {transaction.remark}
                </p>}
            </div>
            <div className="btn-container">
                {isManager && <Link to={`/transactions/${transaction.id}`} state={{ fromSite: true }}>View</Link>}
            </div>
        </div>
    </>;
};

export default Card;
