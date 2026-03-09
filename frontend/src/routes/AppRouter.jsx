import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home"; // situé directement dans pages/
import Login from "../pages/auth/login";
import Register from "../pages/auth/Register";
import Unauthorized from "../pages/Unauthorized";

// Import des pages spécifiques aux rôles
import AutomobilisteDashboard from "../pages/automobiliste/Dashboard";   // exemple
import GarageDashboard from "../pages/garage/Dashboard";                 // exemple
import VendeurDashboard from "../pages/vendeur/Dashboard";               // exemple
import AdminDashboard from "../pages/admin/Dashboard";                   // exemple

import ProtectedRoute from "../components/ProtectedRoute";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Tableaux de bord protégés par rôle */}
        <Route
          path="/automobiliste/*"
          element={
            <ProtectedRoute allowedRoles={["automobiliste"]}>
              <AutomobilisteDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garage/*"
          element={
            <ProtectedRoute allowedRoles={["garage"]}>
              <GarageDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendeur/*"
          element={
            <ProtectedRoute allowedRoles={["vendeur"]}>
              <VendeurDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirection vers le dashboard approprié quand on tape /dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {/* Composant de redirection dynamique selon le rôle */}
              {({ user }) => {
                if (user.role === "automobiliste") return <Navigate to="/automobiliste" replace />;
                if (user.role === "garage") return <Navigate to="/garage" replace />;
                if (user.role === "vendeur") return <Navigate to="/vendeur" replace />;
                if (user.role === "admin") return <Navigate to="/admin" replace />;
                return <Navigate to="/" replace />;
              }}
            </ProtectedRoute>
          }
        />

        {/* Route 404 - optionnelle */}
        <Route path="*" element={<div>Page non trouvée</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;