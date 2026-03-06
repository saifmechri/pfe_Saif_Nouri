import { createContext, useState, useEffect } from "react";
import API from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUser({ token });
    }
  }, []);

  const login = async (formData) => {
    const res = await API.post("/auth/login", formData);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
  };

  const register = async (formData) => {
    await API.post("/auth/register", formData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};