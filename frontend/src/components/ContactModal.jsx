import React from "react";

export default function ContactModal({ open, onClose }) {

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      onClick={handleBackdropClick}
    >

      <div className="auth-modal">

        <button
          className="auth-close"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="auth-title">
          Contact
        </h2>

        <p className="auth-subtitle">
          We'd love to hear from you.
        </p>

        <div style={{ lineHeight: "2", color: "white" }}>

          <div>
            📧 Email:
            {" "}
            <a
              href="mailto:kalyanvkb@gmail.com"
              style={{ color: "#60a5fa" }}
            >
              kalyanvkb@gmail.com
            </a>
          </div>

          <div>
            🌐 Website:
            {" "}
            <a
              href="https://pulse-ai.in"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#60a5fa" }}
            >
              pulse-ai.in
            </a>
          </div>

          <div>
            💡 Feedback and collaboration ideas are welcome.
          </div>

        </div>

      </div>

    </div>
  );
}