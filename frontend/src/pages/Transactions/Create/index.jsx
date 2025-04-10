import "@/pages/form.css";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const TYPES = {
  purchase: "cashier",
  adjustment: "manager",
  redemption: "regular",
  transfer: "regular"
}

const Create = () => {
    const [searchParams] = useSearchParams();
    const { Role, authReady, user, fetchUserData } = useAuth();
    const [transaction, setTransaction] = useState({
        userId: searchParams.get("userId") || undefined,
        utorid: searchParams.get("utorid") || undefined,
        type: searchParams.get("type") || undefined,
        relatedId: searchParams.get("relatedId") || undefined
    });
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
            if (!newTypes.includes(transaction.type)) {                
                setTransaction({
                    ...transaction,
                    type: newTypes[0]
                });
            }
            setTypes(newTypes);
        }
    }, [user]);

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" state={{ fromPage: location }} replace />;
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
                userId: undefined,
                amount: undefined,
                relatedId: undefined
            });
        }
        else if (e.target.value === "redemption") {
            setTransaction({
                ...transaction,
                type: e.target.value,
                userId: undefined,
                utorid: undefined,
                spent: undefined,
                relatedId: undefined,
                promotionIds: undefined
            });
        }
        else if (e.target.value === "transfer") {
            setTransaction({
                ...transaction,
                type: e.target.value,
                utorid: undefined,
                spent: undefined,
                relatedId: undefined,
                promotionIds: undefined
            });
        }
        else if (e.target.value === "adjustment") {
            setTransaction({
                ...transaction,
                type: e.target.value,
                userId: undefined,
                spent: undefined,
                promotionIds: undefined
            });
        }
    };

    const handlePromotionsChange = e => {
        if (e.target.value.trim()) {
            const tokens = e.target.value.split(",");
            setTransaction({
                ...transaction,
                promotionIds: tokens.map(x => x.trim())
            });
        }
        else {
            setTransaction({
                ...transaction,
                promotionIds: undefined
            });
        }
    }

    const clickBack = () => {
        if (location.state?.fromSite) {
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
                        transaction.type === "transfer"   ? `${config.backendUrl}/users/${transaction.userId}/transactions` :
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
                await fetchUserData(user.token);
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
        <h1>Creating Transaction</h1>
        <form onSubmit={handleSubmit}>
            {transaction.type === "transfer" && <>
                <label htmlFor="userId">User ID:</label>
                <input
                    type="text"
                    id="userId"
                    name="userId"
                    placeholder="User ID"
                    value={transaction.userId || ""}
                    onChange={handleChange}
                    required
                />
            </>}
            {transaction.type !== "redemption" && transaction.type !== "transfer" && <>
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
            </>}
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
                <label htmlFor="relatedId">Related ID:</label>
                <input
                    type="number"
                    id="relatedId"
                    name="relatedId"
                    placeholder="Related ID"
                    value={transaction.relatedId || ""}
                    onChange={handleChange}
                    required
                />
            </>}
            {transaction.type === "purchase" && <>
                <label htmlFor="promotionIds">Promotion IDs:</label>
                <input
                    type="text"
                    id="promotionIds"
                    name="promotionIds"
                    placeholder="Promotion IDs"
                    value={transaction.promotionIds?.join(", ") || ""}
                    onChange={handlePromotionsChange}
                />
            </>}
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
