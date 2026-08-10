import { useEffect } from 'react';
import { Outlet } from 'react-router';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';

gsap.registerPlugin(ScrollTrigger);

/**
 * Layout público: Navbar (sticky, fluxo normal — sem offset nas páginas) + Outlet + Footer.
 * Pattern B (nested routes): App.tsx usa <Route element={<Layout/>}> com rotas filhas.
 * Lenis (lerp 0.09) em todas as páginas públicas, sincronizado com ScrollTrigger.
 */
export default function Layout() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-bg-base text-text-primary">
      <CustomCursor />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
