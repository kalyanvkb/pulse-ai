// frontend/src/components/SkeletonCard.jsx — Loading placeholder card

export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skel-row">
        <div className="skel" style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0 }} />
        <div className="skel" style={{ width: 80, height: 12 }} />
        <div className="skel" style={{ width: 50, height: 12, marginLeft: "auto" }} />
      </div>
      <div className="skel" style={{ height: 16, width: "90%" }} />
      <div className="skel" style={{ height: 14, width: "70%" }} />
      <div className="skel" style={{ height: 56, width: "100%" }} />
      <div className="skel" style={{ height: 12, width: "40%" }} />
    </div>
  );
}
