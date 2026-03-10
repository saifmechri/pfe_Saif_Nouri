import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const RoleBasedRedirect = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirection selon le rôle de l'utilisateur
  switch (user.role) {
    case "automobiliste":
      return <Navigate to="/automobiliste" replace />;
    case "garage":
      return <Navigate to="/garage" replace />;
    case "vendeur":
      return <Navigate to="/vendeur" replace />;
    case "admin":
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default RoleBasedRedirect;
