import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;

  let resolvedId = rawUser.userId ?? rawUser.id ?? rawUser.mongoId ?? null;
  if (!resolvedId && rawUser.token) {
    try {
      const decoded = jwtDecode(rawUser.token);
      resolvedId = decoded?.id ?? decoded?.userId ?? null;
    } catch {
      resolvedId = null;
    }
  }

  const normalizedUserId =
    resolvedId;
  const normalizedEmail =
    rawUser.email ?? rawUser.userEmail ?? rawUser.mail ?? "";
  const normalizedPhone =
    rawUser.phone ?? rawUser.phoneNumber ?? rawUser.mobile ?? "";

  return {
    ...rawUser,
    userId: normalizedUserId,
    id: normalizedUserId,
    mongoId: normalizedUserId,
    email: normalizedEmail,
    phone: normalizedPhone,
  };
};

export function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(
    localStorage.getItem("isAuth") === "true",
  );
  const [userRole, setUserRole] = useState(
    localStorage.getItem("userRole") || null,
  );
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      return normalizeUser(JSON.parse(stored));
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem("isAuth", "true");
    if (userData) {
      const normalizedUser = normalizeUser(userData);
      console.log(userData.role);
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setUserRole(userData.role);
      setUser(normalizedUser);
    }
    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem("isAuth");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    setIsAuth(false);
    setUserRole(null);
    setUser(null);

    fetch("http://localhost:8080/api/Authenticate/logout", {
      method: "POST",
      credentials: "include",
    }).catch((err) => console.log("Logout error:", err));
  };

  const isAdmin = () => {
    return userRole === "Admin" || userRole === "ADMIN";
  };

  const updateUser = (partialUserData) => {
    setUser((prev) => {
      if (!prev) return prev;
      const nextUser = normalizeUser({ ...prev, ...partialUserData });
      localStorage.setItem("user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        userRole,
        user,
        login,
        logout,
        isAdmin,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
