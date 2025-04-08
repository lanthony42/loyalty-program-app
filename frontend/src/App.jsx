import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Users from "./pages/Accounts";
import Login from "@/pages/Accounts/Login";
import EditProfile from "@/pages/Accounts/EditProfile";
import Register from "@/pages/Accounts/Register";
import Transactions from "@/pages/Transactions";
import CreateTransaction from "@/pages/Transactions/Create";
import ProcessTransaction from "@/pages/Transactions/Process";
import ViewTransaction from "@/pages/Transactions/View";
import NotFound from "@/pages/NotFound";

const MyRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="register" element={<Register />} />
                <Route path="transactions">
                    <Route index element={<Transactions />} />
                    <Route path="create" element={<CreateTransaction />} />
                    <Route path="process" element={<ProcessTransaction />} />
                    <Route path=":transactionId" element={<ViewTransaction />} />
                </Route>
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <MyRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
