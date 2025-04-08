import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const TYPES = {
  purchase: "cashier",
  adjustment: "manager",
  redemption: "regular",
  transfer: "regular"
}

const Create = () => {
    const { Role, authReady, user } = useAuth();
    const [transaction, setTransaction] = useState({});
    const [types, setTypes] = useState([]);
    const [error, setError] = useState("");    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            const newTypes = [];
            for (const key in TYPES) {
                if (Role[user.role] >= Role[TYPES[key]]) {
                    newTypes.push(key);
                }
            }
            setTransaction({
                ...transaction,
                type: newTypes[0]
            });
            setTypes(newTypes);
        }
    }, [user]);

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setTransaction({
            ...transaction,
            [name]: value
        });
    };

    const handleTypeChange = e => {
        if (e.target.value === "purchase") {
            setTransaction({
                ...transaction,
                type: e.target.value,
                amount: undefined
            });
        }
        else {
            setTransaction({
                ...transaction,
                type: e.target.value,
                spent: undefined
            });
        }
    };

    const handlePromotionsChange = e => {
        const tokens = e.target.value.split(",");
        setTransaction({
            ...transaction,
            promotionIds: tokens.map(x => x.trim())
        });
    }

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
            const url = transaction.type === "redemption" ? `${config.backendUrl}/users/me/transactions` :
                        transaction.type === "transfer"   ? `${config.backendUrl}/users/${transaction.utorid}/transactions` :
                                                            `${config.backendUrl}/transactions`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(transaction),
            });

            if (response.ok) {
                clickBack();
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

    return <>
        <h1>Create Transaction</h1>
        <form onSubmit={handleSubmit}>
            <label htmlFor="utorid">UTORid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                placeholder="UTORid"
                value={transaction.utorid || ""}
                onChange={handleChange}
                required
            />
            <label htmlFor="type">Type:</label>
            <select
                type="text"
                id="type"
                name="type"
                placeholder="Type"
                value={transaction.type || ""}
                onChange={handleTypeChange}
                required
            >
                {types.map(type => (
                    <option key={type} value={type}>{`${type.charAt(0).toUpperCase()}${type.slice(1)}`}</option>
                ))}
            </select>
            {transaction.type === "purchase" ? <>
                <label htmlFor="amount">Spent:</label>
                <input
                    type="number"
                    id="spent"
                    name="spent"
                    placeholder="Spent"
                    min="0"
                    value={transaction.spent || ""}
                    onChange={handleChange}
                    required
                />
            </> : <>
                <label htmlFor="amount">Amount:</label>
                <input
                    type="number"
                    id="amount"
                    name="amount"
                    placeholder="Amount"
                    step="1"
                    value={transaction.amount || ""}
                    onChange={handleChange}
                    required
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
                    onChange={handleChange}
                    required
                />
            </>}
            <label htmlFor="promotionIds">Promotion Ids:</label>
            <input
                type="text"
                id="promotionIds"
                name="promotionIds"
                placeholder="Promotion Ids"
                value={transaction.promotionIds?.join(", ") || ""}
                onChange={handlePromotionsChange}
            />
            <label htmlFor="remark">Remark:</label>
            <input
                type="text"
                id="remark"
                name="remark"
                placeholder="Remark"
                value={transaction.remark || ""}
                onChange={handleChange}
            />
            <div className="btn-container">
                <button type="button" onClick={clickBack}>Back</button>
                <button type="submit">Create</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default Create;
