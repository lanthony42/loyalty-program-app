import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Accounts";
import UpdateUser from "@/pages/Accounts/Update";
import Login from "@/pages/Accounts/Login";
import Reset from "@/pages/Accounts/Reset";
import EditProfile from "@/pages/Accounts/EditProfile";
import Register from "@/pages/Accounts/Register";
import Transactions from "@/pages/Transactions";
import CreateTransaction from "@/pages/Transactions/Create";
import ProcessTransaction from "@/pages/Transactions/Process";
import ViewTransaction from "@/pages/Transactions/View";
import Promotions from "@/pages/Promotions";
import CreatePromotion from "@/pages/Promotions/Create"
import ViewPromotion from "@/pages/Promotions/View";
import Events from "@/pages/Events";
import CreateEvent from "@/pages/Events/Create"
import ViewEvent from "@/pages/Events/View";
import NotFound from "@/pages/NotFound";

const MyRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="reset" element={<Reset />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users">
                    <Route index element={<Users />} />
                    <Route path=":userId" element={<UpdateUser />} />
                </Route>
                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="register" element={<Register />} />
                <Route path="transactions">
                    <Route index element={<Transactions />} />
                    <Route path="create" element={<CreateTransaction />} />
                    <Route path="process" element={<ProcessTransaction />} />
                    <Route path=":transactionId" element={<ViewTransaction />} />
                </Route>
                <Route path="promotions">
                    <Route index element={<Promotions />} />
                    <Route path="create" element={<CreatePromotion />} />
                    <Route path=":promotionId" element={<ViewPromotion />} />
                </Route>
                <Route path="events">
                    <Route index element={<Events />} />
                    <Route path="create" element={<CreateEvent />} />
                    <Route path=":eventId" element={<ViewEvent />} />
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
