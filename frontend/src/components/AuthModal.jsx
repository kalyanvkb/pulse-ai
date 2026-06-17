import React from "react";
import { loginWithGoogle } from "../firebase";

export default function AuthModal({ open, onClose }) {
  if (!open) return null;

  const handleGoogleLogin = async () => {
    try {
      console.log("========== USER AGENT ==========");
      console.log(navigator.userAgent);
      console.log("================================");

      // This may either resolve instantly (Popup) OR redirect the page away (Redirect)
      const result = await loginWithGoogle();

      // ===================================================================
      // CRITICAL NOTE: The logic below only executes if a POPUP was used.
      // If a Redirect occurred, the page reloads, and the redirect token
      // must be caught at your top-level App initialization layout.
      // ===================================================================
      if (result && result.user) {
        console.log("Firebase popup login success");
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
      }
    } catch (err) {
      console.error("Error during authentication invocation:", err);
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
        <button className="auth-close" onClick={onClose}>
          ×
        </button>

        <h2 className="auth-title">Welcome to pulse.ai</h2>

        <p className="auth-subtitle">
          Personalize your AI news feed, save preferences, bookmark articles and sync across devices.
        </p>

        <button className="google-btn" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <button className="guest-btn" onClick={onClose}>
          Continue as Guest
        </button>

        <p className="auth-footer">
          Guest users can browse freely. Login enables personalization.
        </p>
      </div>
    </div>
  );
}