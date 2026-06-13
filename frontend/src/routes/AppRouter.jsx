import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Home from "../pages/Home"; // situé directement dans pages/
import Login from "../pages/auth/login";
import Register from "../pages/auth/Register";
import AdminLogin from "../pages/auth/AdminLogin";
import Unauthorized from "../pages/Unauthorized";
import Profil from '../pages/profil/profil';
import AutomobilisteRecommendations from "../pages/automobiliste/Recommendations";
import GaragesPage from "../pages/automobiliste/Garages";
import AutomobilisteAppointments from "../pages/automobiliste/Appointments";
import AppointmentDetail from "../pages/AppointmentDetail";
import VehicleHistory from "../pages/automobiliste/VehicleHistory";
import InterventionDetail from "../pages/automobiliste/InterventionDetail";
import MaintenancePage from "../pages/automobiliste/maintenance/MaintenancePage";
import CataloguePieces from "../pages/vendeur/CataloguePieces";
import ComparaisonPrix from "../pages/vendeur/ComparaisonPrix";
import ChatCenter from "../pages/chat/ChatCenter";

// Import des pages spécifiques aux rôles
import AutomobilisteDashboard from "../pages/automobiliste/Dashboard";   // exemple
import GarageDashboard from "../pages/garage/Dashboard";                 // exemple
import GarageAppointments from "../pages/garage/Appointments";
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
        <Route path="/admin/login" element={<AdminLogin />} />
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
          path="/automobiliste/garages"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "vendeur", "admin"]}>
              <GaragesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste/appointments"
          element={
            <ProtectedRoute allowedRoles={["automobiliste"]}>
              <AutomobilisteAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste/messages"
          element={
            <ProtectedRoute allowedRoles={["automobiliste"]}>
              <ChatCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste/catalogue"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "vendeur", "admin", "garage"]}>
              <CataloguePieces />
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
          path="/garage/messages"
          element={
            <ProtectedRoute allowedRoles={["garage"]}>
              <ChatCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garage/appointments"
          element={
            <ProtectedRoute allowedRoles={["garage"]}>
              <GarageAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={["garage", "automobiliste", "admin"]}>
              <AppointmentDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicules/:vehicleId/history"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "admin"]}>
              <VehicleHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicules/:vehicleId/interventions/:id"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "garage", "admin"]}>
              <InterventionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicules/:vehicleId/alerts"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "admin"]}>
              <MaintenancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garage/appointments/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={["garage"]}>
              <AppointmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
  path="/garage/catalogue"
  element={
    <ProtectedRoute allowedRoles={["garage"]}>
      <CataloguePieces />
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
          path="/vendeur/messages"
          element={
            <ProtectedRoute allowedRoles={["vendeur"]}>
              <ChatCenter />
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
          path="/vendeur/magasin"
          element={
            <ProtectedRoute allowedRoles={["vendeur", "admin", "automobiliste", "garage"]}>
              <CataloguePieces />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendeur/comparaison"
          element={
            <ProtectedRoute allowedRoles={["vendeur", "admin", "automobiliste", "garage"]}>
              <ComparaisonPrix />
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
          path="/admin/messages"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ChatCenter />
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