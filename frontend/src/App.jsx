import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";

const MyRoutes = () => {
  return <Routes>
    <Route path="/" element={<Layout />}>

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
