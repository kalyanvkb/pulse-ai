import React from "react";
import { loginWithGoogle } from "../firebase";

export default function AuthModal({ open, onClose }) {

  if (!open) return null;

const handleGoogleLogin = async () => {
  try {
    const result = await loginWithGoogle();

    const token = await result.user.getIdToken();

    localStorage.setItem("token", token);

    await fetch("/api/auth/google-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

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