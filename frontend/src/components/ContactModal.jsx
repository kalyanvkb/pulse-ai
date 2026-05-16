export default function ContactModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="contact-header">Get in Touch</div>

        <div className="contact-info">
          <div className="info-item">
            <span className="info-label">Name</span>
            <span className="info-value">Kalyan Chakravarthy Yapuram</span>
          </div>

          <div className="info-item">
            <span className="info-label">Email</span>
            <a href="mailto:kalyanvkb@gmail.com" className="info-link">
              kalyanvkb@gmail.com
            </a>
          </div>

          <div className="info-item">
            <span className="info-label">Project</span>
            <span className="info-value">pulse-ai — AI & Tech News Aggregator</span>
          </div>

          <div className="info-item">
            <span className="info-label">Domain</span>
            <span className="info-value">pulse-ai.in</span>
          </div>
        </div>
      </div>
    </>
  );
}
