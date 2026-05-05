import { createContext, useState, useEffect } from "react";
import API from "../services/api";

export const AuthContext = createContext();

const ADMIN_SESSION_KEY = "admin_session";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);

    if (adminSession) {
      try {
        const parsedAdminSession = JSON.parse(adminSession);
        setUser(parsedAdminSession);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }

    if (token) {
      API.get("/auth/profile")
        .then((res) => {
          setUser(res.data?.data?.user || res.data?.user || res.data);
        })
        .catch(async () => {
          localStorage.removeItem("token");

          try {
            const session = localStorage.getItem(ADMIN_SESSION_KEY);
            if (session) {
              const parsedSession = JSON.parse(session);
              setUser(parsedSession);
              return;
            }
          } catch {
            localStorage.removeItem(ADMIN_SESSION_KEY);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (formData) => {
    const res = await API.post("/auth/login", formData);
    const userData = res.data?.data?.user || res.data?.user;
    const token = res.data?.data?.token || res.data?.token;

    localStorage.setItem("token", token);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setUser(userData);
  };

  const loginAdmin = async (formData) => {
    const res = await API.post("/admin/login", formData);
    const token = res.data?.data?.token || res.data?.token;

    localStorage.setItem("token", token);

    const adminUser = {
      id: "admin",
      name: "Administrateur",
      email: formData.email,
      role: "admin"
    };

    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminUser));
    setUser(adminUser);
  };

  const register = async (formData) => {
    await API.post("/auth/register", formData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setUser(null);
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAdmin, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};