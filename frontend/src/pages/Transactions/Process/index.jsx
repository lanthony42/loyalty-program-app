import "@/pages/form.css";
import { useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const Process = () => {
    const [searchParams] = useSearchParams();
    const [transactionId, setTransactionId] = useState(searchParams.get("transactionId"));
    const [error, setError] = useState("");
    const { Role, authReady, user, fetchUserData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" state={{ fromPage: location }} replace />;
    }

    const isCashier = Role[user.role] >= Role.cashier;
    if (!isCashier) {
        return <Navigate to="/dashboard" replace />;
    }

    const changeTransactionId = e => {
        setTransactionId(e.target.value);
    };

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
            const url = `${config.backendUrl}/transactions/${transactionId}/processed`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ processed: true }),
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
        <h1>Processing Redemption</h1>
        <form onSubmit={handleSubmit}>
            <label htmlFor="userId">Transaction Id:</label>
            <input
                type="number"
                id="transactionId"
                name="transactionId"
                placeholder="Transaction Id"
                value={transactionId || ""}
                onChange={changeTransactionId}
                required
            />
            <div className="btn-container">
                <button type="button" onClick={clickBack}>Back</button>
                <button type="submit">Process</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default Process;
