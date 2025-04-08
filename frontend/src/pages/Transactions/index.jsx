import "@/pages/main.css";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
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
            page: parseInt(searchParams.get("page")) || 1
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

    const fetchTransactionData = async () => {
        const result = [];
        for (const key in query) {
            if (query[key] != null) {
                result.push(`${key}=${query[key]}`);
            }
        }
        const params = result.join("&");        
        const url = user.role < Role.MANAGER ? `${config.backendUrl}/users/me/transactions?${params}` :
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

    const changePage = newPage => {
        setSearchParams(params => {
            params.set("page", newPage);
            return params;
        });
    };

    return (
        <div>
            <h1>Transactions</h1>
            <ul>
                {transactions.map(transaction => (
                    <li key={transaction.id}>{transaction.type}</li>
                ))}
            </ul>
            <div>
                <button
                    onClick={() => changePage(query.page - 1)}
                    disabled={query.page === 1}
                >
                    Previous
                </button>
                <span>Page {query.page} of {totalPages}</span>
                <button
                    onClick={() => changePage(query.page + 1)}
                    disabled={query.page === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
      );
};

export default Transactions;
