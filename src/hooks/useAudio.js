import { useCallback, useEffect, useRef, useState } from 'react';

/** One shared <audio> element for previews: play/toggle/stop + progress. */
export function useAudio() {
  const ref = useRef(null);
  if (!ref.current) ref.current = new Audio();
  const [state, setState] = useState({ src: null, playing: false, progress: 0 });

  useEffect(() => {
    const a = ref.current;
    const update = () =>
      setState({
        src: a.currentSrc || a.src || null,
        playing: !a.paused,
        progress: a.duration ? a.currentTime / a.duration : 0,
      });
    const events = ['play', 'pause', 'timeupdate', 'ended', 'emptied'];
    events.forEach((e) => a.addEventListener(e, update));
    return () => {
      events.forEach((e) => a.removeEventListener(e, update));
      a.pause();
    };
  }, []);

  const play = useCallback((url) => {
    const a = ref.current;
    if (a.src !== url) a.src = url;
    a.play().catch(() => {
      /* autoplay blocked: the user can press play */
    });
  }, []);

  const toggle = useCallback(
    (url) => {
      const a = ref.current;
      if (a.src === url && !a.paused) a.pause();
      else play(url);
    },
    [play],
  );

  const stop = useCallback(() => ref.current.pause(), []);

  const isPlaying = useCallback((url) => state.playing && state.src === url, [state]);

  return { ...state, play, toggle, stop, isPlaying };
}
