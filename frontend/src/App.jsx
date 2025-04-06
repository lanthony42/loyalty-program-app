import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Success from "./pages/Success";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

const MyRoutes = () => {
  return <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/success" element={<Success />} />
      <Route path="/profile" element={<Profile />} />
    </Route>
  </Routes>
}

function App() {
  return (
      <BrowserRouter>
          <AuthProvider>
              <MyRoutes />
          </AuthProvider>
      </BrowserRouter>
  );
}

export default App
