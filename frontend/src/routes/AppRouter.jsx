import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Home from "../pages/Home"; // situé directement dans pages/
import Login from "../pages/auth/login";
import Register from "../pages/auth/Register";
import AdminLogin from "../pages/auth/AdminLogin";
import Unauthorized from "../pages/Unauthorized";
import Profil from '../pages/profil/profil';
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
        {/* Recommandations dynamiques supprimées */}
        <Route
          path="/automobiliste/garages"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "vendeur", "admin"]}>
              <GaragesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendeur/garages"
          element={
            <ProtectedRoute allowedRoles={["vendeur", "admin"]}>
              <GaragesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste/appointments"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "vendeur", "admin"]}>
              <AutomobilisteAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendeur/appointments"
          element={
            <ProtectedRoute allowedRoles={["vendeur", "admin"]}>
              <AutomobilisteAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste/messages"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "admin"]}>
              <ChatCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste/*"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "admin"]}>
              <AutomobilisteDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/automobiliste"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "admin"]}>
              <AutomobilisteDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garage/messages"
          element={
            <ProtectedRoute allowedRoles={["garage", "admin"]}>
              <ChatCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garage/appointments"
          element={
            <ProtectedRoute allowedRoles={["garage", "admin"]}>
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
            <ProtectedRoute allowedRoles={["garage", "admin"]}>
              <AppointmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garage/*"
          element={
            <ProtectedRoute allowedRoles={["garage", "admin"]}>
              <GarageDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/garage"
          element={
            <ProtectedRoute allowedRoles={["garage", "admin"]}>
              <GarageDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendeur/messages"
          element={
            <ProtectedRoute allowedRoles={["vendeur", "admin"]}>
              <ChatCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vendeur/*"
          element={
            <ProtectedRoute allowedRoles={["vendeur", "admin"]}>
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
          path="/automobiliste/catalogue"
          element={
            <ProtectedRoute allowedRoles={["automobiliste", "admin", "garage", "vendeur"]}>
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
            <ProtectedRoute allowedRoles={["vendeur", "admin"]}>
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
        <Route
          path="/admin/messages"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ChatCenter />
            </ProtectedRoute>
          }
        />
        {/* Admin view of garages (reuse existing GaragesPage) */}
        <Route
          path="/admin/garages"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <GaragesPage />
            </ProtectedRoute>
          }
        />
        {/* Admin view of catalogue (reuse CataloguePieces) */}
        <Route
          path="/admin/catalogue"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CataloguePieces />
            </ProtectedRoute>
          }
        />
        {/* Garage view of catalogue (reuse CataloguePieces) */}
        <Route
          path="/garage/catalogue"
          element={
            <ProtectedRoute allowedRoles={["garage", "admin", "vendeur", "automobiliste"]}>
              <CataloguePieces />
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

