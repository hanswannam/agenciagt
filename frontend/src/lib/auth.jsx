import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("innovagraf_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("innovagraf_token")) && !user);

  useEffect(() => {
    const token = localStorage.getItem("innovagraf_token");
    if (token && !user) {
      api
        .get("/auth/me")
        .then((r) => {
          setUser(r.data);
          localStorage.setItem("innovagraf_user", JSON.stringify(r.data));
        })
        .catch(() => {
          localStorage.removeItem("innovagraf_token");
          localStorage.removeItem("innovagraf_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("innovagraf_token", data.token);
    localStorage.setItem("innovagraf_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("innovagraf_token");
    localStorage.removeItem("innovagraf_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
