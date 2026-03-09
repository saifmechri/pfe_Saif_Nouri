import { createContext, useState, useEffect } from "react";
import API from "../services/api"; // votre instance axios

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // pour attendre le chargement du profil

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Appel à l'API pour obtenir le profil complet
      API.get("/auth/profile")
        .then((res) => {
          setUser(res.data); // contient { nom, prenom, email, role, ... }
        })
        .catch(() => {
          localStorage.removeItem("token"); // token invalide ou expiré
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (formData) => {
    const res = await API.post("/auth/login", formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user); // utilisateur complet avec rôle
  };

  const register = async (formData) => {
    await API.post("/auth/register", formData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};