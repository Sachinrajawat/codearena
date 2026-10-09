import { Routes, Route, Navigate } from "react-router";
import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { checkAuth } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import ProblemPage from "./pages/ProblemPage";
import CreateProblem from "./components/CreateProblem";
import AdminDelete from "./components/AdminDelete";
import AdminUpdate from "./components/AdminUpdate";
import UpdateProblem from "./components/UpdateProblem";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const { isAuthenticated, isLoading, user } = useSelector(
    (state) => state.auth,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Wait for the cookie check before rendering any route
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-semibold">Loading...</h1>
      </div>
    );
  }

  const isAdmin = isAuthenticated && user?.role === "admin";

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Homepage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
        />
        <Route
          path="/problem/:problemId"
          element={isAuthenticated ? <ProblemPage /> : <Navigate to="/login" />}
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/create"
          element={isAdmin ? <CreateProblem /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/update"
          element={isAdmin ? <AdminUpdate /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/update/:id"
          element={isAdmin ? <UpdateProblem /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/delete"
          element={isAdmin ? <AdminDelete /> : <Navigate to="/" />}
        />
      </Routes>
    </>
  );
}

export default App;