/**
 * Full-screen overlay with one big button. In party mode it hides the next song
 * until the right player has the device ("Pass to Alice").
 */
export default function TapOverlay({ title, sub, onTap }) {
  return (
    <button className="tap-overlay" onClick={onTap} autoFocus>
      <span className="tap-icon" aria-hidden="true">
        ▶
      </span>
      <span className="tap-title">{title}</span>
      {sub && <span className="tap-sub">{sub}</span>}
    </button>
  );
}
