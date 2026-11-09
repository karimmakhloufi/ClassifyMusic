/**
 * Full-screen "Tap to start" overlay. Browsers only allow sound after a user
 * gesture, so this gives the player one tap before the first preview plays.
 */
export default function TapOverlay({ ready, onTap }) {
  return (
    <button className="tap-overlay" onClick={onTap} autoFocus>
      <span className="tap-icon" aria-hidden="true">
        ▶
      </span>
      <span className="tap-title">Tap to start</span>
      <span className="tap-sub">{ready ? 'Turn your sound on 🔊' : 'Loading songs…'}</span>
    </button>
  );
}
