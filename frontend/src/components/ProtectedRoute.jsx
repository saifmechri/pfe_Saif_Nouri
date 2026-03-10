import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  // Afficher un loader pendant la restauration de l'utilisateur
  if (loading) {
    return <div className="text-center p-10">Chargement...</div>;
  }

  // Non connecté → redirection vers login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont exigés et que l'utilisateur n'a pas le bon rôle
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Tout est OK → afficher la page demandée
  return children;
};

export default ProtectedRoute;