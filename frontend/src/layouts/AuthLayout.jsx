// src/layouts/AuthLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { auth, getRedirectResult } from "../firebase";

export default function AuthLayout() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    handleRedirect();
  }, []);

  if (loading) return <div>Loading account details...</div>;

  // Outlet renders whatever child route the user is visiting
  return <Outlet />;
}