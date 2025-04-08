import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const View = () => {
    const [transaction, setTransaction] = useState(null);
    const [error, setError] = useState("");
    const { transactionId } = useParams();
    const { Role, authReady, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            fetchTransactionData();
        }
    }, [user]);

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isManager = Role[user.role] >= Role.manager;
    if (!isManager) {
        return <Navigate to="/dashboard" replace />;
    }

    const fetchTransactionData = async () => {
        try {
            const url = `${config.backendUrl}/transactions/${transactionId}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTransaction(data);
            }
            else if (response.status === 404) {
                navigate("/404");
            }
            else {
                throw new Error("Failed to fetch transaction data");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    const changeSuspicious = e => {
        setTransaction({
            ...transaction,
            suspicious: e.target.checked
        });
    };

    const clickBack = () => {
        if (location.state?.fromList) {
            navigate(-1);
        }
        else {
            navigate('/transactions');
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/transactions/${transaction.id}/suspicious`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ suspicious: transaction.suspicious }),
            });

            if (response.ok) {
                await fetchTransactionData();
            }
            else {
                const json = await response.json();
                setError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setError("An error occurred while updating");
        }
    };
    
    return !transaction ? <p>Loading...</p> : <>
        <h1>Transaction {transaction.id}</h1>
        <form onSubmit={handleSubmit}>
            <label htmlFor="utorid">UTORid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                placeholder="UTORid"
                value={transaction.utorid || ""}
                disabled
            />
            <label htmlFor="type">Type:</label>
            <input
                type="text"
                id="type"
                name="type"
                placeholder="Type"
                value={transaction.type || ""}
                disabled
            />
            <label htmlFor="amount">Amount:</label>
            <input
                type="number"
                id="amount"
                name="amount"
                placeholder="Amount"
                value={transaction.amount || ""}
                disabled
            />
            {transaction.type === "purchase" && <>
                <label htmlFor="amount">Spent:</label>
                <input
                    type="number"
                    id="spent"
                    name="spent"
                    placeholder="Spent"
                    value={transaction.spent || ""}
                    disabled
                />
            </>}
            {transaction.type === "adjustment" && <>
                <label htmlFor="relatedId">Related Id:</label>
                <input
                    type="number"
                    id="relatedId"
                    name="relatedId"
                    placeholder="Related Id"
                    value={transaction.relatedId || ""}
                    disabled
                />
            </>}
            <label htmlFor="promotionIds">Promotion Ids:</label>
            <input
                type="text"
                id="promotionIds"
                name="promotionIds"
                placeholder="Promotion Ids"
                value={transaction.promotionIds.join(", ") || ""}
                disabled
            />
            <label htmlFor="suspicious">Suspicious:</label>
            <input
                type="checkbox"
                id="suspicious"
                name="suspicious"
                value={transaction.suspicious || false}
                onChange={changeSuspicious}
            />
            <label htmlFor="remark">Remark:</label>
            <input
                type="text"
                id="remark"
                name="remark"
                placeholder="Remark"
                value={transaction.remark || ""}
                disabled
            />
            <label htmlFor="createdBy">Created By:</label>
            <input
                type="text"
                id="createdBy"
                name="createdBy"
                placeholder="Created By"
                value={transaction.createdBy || ""}
                disabled
            />
            <div className="btn-container">
                <button type="button" onClick={clickBack}>Back</button>
                <button type="submit">Update</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default View;
