import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Home from "../pages/Home"; // situé directement dans pages/
import Login from "../pages/auth/login";
import Register from "../pages/auth/Register";
import Unauthorized from "../pages/Unauthorized";
import Profil from '../pages/profil/profil';
import AutomobilisteRecommendations from "../pages/automobiliste/Recommendations";
import CataloguePieces from "../pages/vendeur/CataloguePieces";

// Import des pages spécifiques aux rôles
import AutomobilisteDashboard from "../pages/automobiliste/Dashboard";   // exemple
import GarageDashboard from "../pages/garage/Dashboard";                 // exemple
import VendeurDashboard from "../pages/vendeur/Dashboard";               // exemple
import AdminDashboard from "../pages/admin/Dashboard";                   // exemple

import ProtectedRoute from "../components/ProtectedRoute";
import RoleBasedRedirect from "../components/RoleBasedRedirect";
import { AuthContext } from "../context/AuthContext";


const AppRouter = () => {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Redirection vers le dashboard approprié - DOIT être avant les routes avec wildcard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />

        {/* Tableaux de bord protégés par rôle */}
        <Route
          path="/automobiliste/recommandations"
          element={
            <ProtectedRoute allowedRoles={["automobiliste"]}>
              <AutomobilisteRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste/*"
          element={
            <ProtectedRoute allowedRoles={["automobiliste"]}>
              <AutomobilisteDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste"
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
          path="/garage"
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
          path="/vendeur/catalogue"
          element={
            <ProtectedRoute allowedRoles={["vendeur", "admin", "automobiliste", "garage"]}>
              <CataloguePieces />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendeur"
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
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Route 404 - optionnelle */}
        <Route path="*" element={<div>Page non trouvée</div>} />
        <Route
  path="/profil"
  element={
    <ProtectedRoute>
      <Profil />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;