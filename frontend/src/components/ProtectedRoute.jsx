import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  // Afficher un loader pendant la restauration de l'utilisateur
  if (loading) {
    return <div className="text-center p-10">Chargement...</div>;
  }

  // Non connectÃ© â†’ redirection vers login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si des rÃ´les sont exigÃ©s et que l'utilisateur n'a pas le bon rÃ´le
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Tout est OK â†’ afficher la page demandÃ©e
  return children;
};

export default ProtectedRoute;

