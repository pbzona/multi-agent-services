export default function Loading() {
  return (
    <div aria-label="Loading page" className="loading-page" role="status">
      <div className="skeleton skeleton-eyebrow" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}
