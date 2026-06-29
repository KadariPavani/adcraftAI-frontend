import { useEffect, useRef, useState } from "react";

export function useInView<T extends Element = HTMLElement>(
  opts: IntersectionObserverInit & { once?: boolean } = {},
) {
  const { once = true, threshold = 0.25, ...ioOpts } = opts;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, ...ioOpts },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, threshold]);

  return { ref, inView };
}
