import React from "react";
import { loginWithGoogle } from "../firebase";

useEffect(() => {
  console.log("USER AGENT:", navigator.userAgent);
}, []);

export default function AuthModal({ open, onClose }) {

  if (!open) return null;

const handleGoogleLogin = async () => {
  try {

    console.log("========== USER AGENT ==========");
    console.log(navigator.userAgent);
    console.log("================================");

    const result = await loginWithGoogle();

    console.log("Firebase login success");
    console.log(result.user);

    const token = await result.user.getIdToken();

    localStorage.setItem("token", token);

    const response = await fetch("/api/auth/google-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    console.log(data);

    onClose();

  } catch (err) {
    console.error(err);
  }
};

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={handleBackdropClick}>

      <div className="auth-modal">

        <button
          className="auth-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="auth-title">
          Welcome to pulse.ai
        </h2>

        <p className="auth-subtitle">
          Personalize your AI news feed, save preferences,
          bookmark articles and sync across devices.
        </p>

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>

        <button
          className="guest-btn"
          onClick={onClose}
        >
          Continue as Guest
        </button>

        <p className="auth-footer">
          Guest users can browse freely.
          Login enables personalization.
        </p>

      </div>

    </div>
  );
}