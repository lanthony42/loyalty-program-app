import "@/pages/main.css";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import config from "@/config";

const PAGE_LIMIT = 10;

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const { Role, authReady, user } = useAuth();

    const query = useMemo(() => {
        return {
            page: parseInt(searchParams.get("page")) || 1,
            name: searchParams.get("name") || "",
            createdBy: searchParams.get("createdBy") || "",
            suspicious: searchParams.get("suspicious") || "",
            promotionId: searchParams.get("promotionId") || "",
            type: searchParams.get("type") || "",
            relatedId: searchParams.get("relatedId") || "",
            amount: searchParams.get("amount") || "",
            operator: searchParams.get("operator") || ""
        };
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            fetchTransactionData();
        }
    }, [user, query]);

    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isManager = Role[user.role] >= Role.manager;

    const fetchTransactionData = async () => {
        const result = [];
        for (const key in query) {
            if (query[key] != null && query[key] !== "") {
                result.push(`${key}=${query[key]}`);
            }
        }
        const params = result.join("&");
        const url = !isManager ? `${config.backendUrl}/users/me/transactions?${params}` :
                                 `${config.backendUrl}/transactions?${params}`;
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTransactions(data.results);
                setTotalPages(Math.ceil(data.count / PAGE_LIMIT));
            }
            else {
                throw new Error("Failed to fetch transaction data");
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    const changeFilter = e => {
        const { name, value } = e.target;
        setSearchParams(params => {
            if (value) {
                searchParams.set(name, value);
            }
            else {
                searchParams.delete(name);

                // Clear dependant parameters
                if (name === "type") {
                    searchParams.delete("relatedId");
                }
                else if (name === "operator") {
                    searchParams.delete("amount");
                }
            }
            searchParams.set("page", 1);
            return params;
        });
    };

    const changePage = newPage => {
        setSearchParams(params => {
            params.set("page", newPage);
            return params;
        });
    };

    return <>
        <h1>Transactions</h1>
        <Link to="/transactions/create">Create New</Link>
        <div>
            {isManager && <>
                <input
                    name="name"
                    value={query.name}
                    placeholder="Name or UTORid"
                    onChange={changeFilter}
                />
                <input
                    name="createdBy"
                    value={query.createdBy}
                    placeholder="Created By"
                    onChange={changeFilter}
                />
                <select
                    name="suspicious"
                    value={query.suspicious}
                    onChange={changeFilter}
                >
                    <option value="">Suspicious?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </>}
            <select
                name="type"
                value={query.type}
                onChange={changeFilter}
            >
                <option value="">Select Transaction Type</option>
                <option value="purchase">Purchase</option>
                <option value="adjustment">Adjustment</option>
                <option value="redemption">Redemption</option>
                <option value="transfer">Transfer</option>
                <option value="event">Event</option>
            </select>
            <input
                name="relatedId"
                value={query.relatedId}
                type="number"
                placeholder="Related ID"
                onChange={changeFilter}
                disabled={!query.type || query.type === "purchase"}
            />
            <input
                name="promotionId"
                value={query.promotionId}
                type="number"
                placeholder="Promotion ID"
                onChange={changeFilter}
            />
            <select
                name="operator"
                value={query.operator}
                onChange={changeFilter}
            >
                <option value="">Operator</option>
                <option value="gte">≥</option>
                <option value="lte">≤</option>
            </select>
            <input
                name="amount"
                value={query.amount}
                type="number"
                placeholder="Amount"
                onChange={changeFilter}
                disabled={!query.operator}
            />
        </div>
        <ul>
            {transactions.map(transaction => (
                <li key={transaction.id}>
                    Id: {transaction.id} - Type: {transaction.type}
                    {isManager && <Link to={`/transactions/${transaction.id}`} state={{ fromList: true }}>
                        View
                    </Link>}
                </li>
            ))}
        </ul>
        <div>
            <button
                onClick={() => changePage(query.page - 1)}
                disabled={query.page === 1}
            >
                Previous
            </button>
            <span>Page {Math.min(query.page, totalPages)} of {totalPages}</span>
            <button
                onClick={() => changePage(query.page + 1)}
                disabled={query.page === totalPages}
            >
                Next
            </button>
        </div>
    </>;
};

export default Transactions;
