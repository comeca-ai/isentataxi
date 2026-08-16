import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Progresso de leitura: barra zebrada 3px fixa logo abaixo da navbar,
 * preenchendo com o scroll da página (ScrollTrigger scrub).
 * Componente GSAP isolado — sem Framer Motion aqui dentro.
 */
export default function ReadingProgress() {
  const root = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const bar = fill.current;
    if (!el || !bar) return;

    // Posiciona a barra exatamente abaixo da navbar sticky (que tem altura variável)
    const header = document.querySelector('header');
    const place = () => {
      el.style.top = `${header ? header.getBoundingClientRect().height : 0}px`;
    };
    place();
    window.addEventListener('resize', place);

    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      window.removeEventListener('resize', place);
    };
  }, []);

  return (
    <div ref={root} className="fixed left-0 right-0 z-40 h-[3px] bg-border-subtle/60" aria-hidden="true">
      <div ref={fill} className="zebra h-full w-full origin-left" style={{ transform: 'scaleX(0)' }} />
    </div>
  );
}
