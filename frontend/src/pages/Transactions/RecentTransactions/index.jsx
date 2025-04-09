import { useEffect, useState } from "react";
import TransactionCard from "@/pages/Transactions/Card";
import QRCode from "@/pages/Transactions/QRCode";
import config from "@/config";

const RECENT_LIMIT = 4;

const RecentTransactions = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [qrOpen, setQROpen] = useState(false);
  const [qrUrl, setQRUrl] = useState(null);

  useEffect(() => {
    if (user) {
      fetchRecentTransactions();
    }
  }, [user]);

  const fetchRecentTransactions = async () => {
    try {
      const url = `${config.backendUrl}/users/me/transactions?limit=${RECENT_LIMIT}`; 

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${user.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.results);
      } else {
        console.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const showQRCode = (transactionId) => {
    const url = `${window.location.origin}/transactions/${transactionId}`;
    setQRUrl(url);
    setQROpen(true);
  };

  return (
    <div>
      <h3>Recent Transactions</h3>
      <div className="grid-container">
        {transactions.length === 0 ? (
          <p className="no-transactions">No transactions to display</p>
        ) : (
          transactions.map(transaction => (
            <div key={transaction.id} className="transaction-card">
              <TransactionCard transaction={transaction} showQRCode={showQRCode} />
            </div>
          ))
        )}
      </div>

      {qrOpen && (
        <QRCode url={qrUrl} onClose={() => setQROpen(false)} />
      )}
    </div>
  );
};

export default RecentTransactions;
