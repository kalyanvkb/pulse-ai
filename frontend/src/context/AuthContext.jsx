import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, getRedirectResult, onAuthStateChanged } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirectAndAuth = async () => {
      try {
        // 1. Catch the token if they just came back from Google
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const token = await result.user.getIdToken();
          localStorage.setItem("token", token);
          
          await fetch("/api/auth/google-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
        }
      } catch (err) {
        console.error("Redirect auth error:", err);
      }

      // 2. Listen for the persistence state (handles page refreshes)
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });

      return unsubscribe;
    };

    handleRedirectAndAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);