import { useEffect } from 'react';
import { useLocation } from 'react-router';
import ReadingProgress from '@/components/guia/ReadingProgress';
import Toc from '@/components/guia/Toc';
import GuiaHero from '@/components/guia/GuiaHero';
import SectionIsencoes from '@/components/guia/SectionIsencoes';
import SectionIpva from '@/components/guia/SectionIpva';
import SectionQuemPode from '@/components/guia/SectionQuemPode';
import SectionCarro from '@/components/guia/SectionCarro';
import SectionEtapas from '@/components/guia/SectionEtapas';
import SectionPrazos from '@/components/guia/SectionPrazos';
import SectionFaq from '@/components/guia/SectionFaq';
import FinalCtaBanner from '@/components/guia/FinalCtaBanner';

/**
 * /guia — Educativo long-form (IPI, ICMS, STJ, carência, órgãos, tabela de alíquotas).
 * Suporta âncoras #etapa-1…#etapa-7 (links vindos da home/dashboard) e sumário sticky.
 */
export default function Guia() {
  const { hash } = useLocation();

  // Deep-links (/guia#etapa-N): o navegador tenta rolar antes do React montar,
  // então repetimos a rolagem após o paint. `scroll-mt-32` cuida do offset da navbar.
  useEffect(() => {
    if (!hash) return;
    const id = hash.slice(1);
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts++ < 10) {
        window.setTimeout(tryScroll, 100);
      }
    };
    const t = window.setTimeout(tryScroll, 60);
    return () => window.clearTimeout(t);
  }, [hash]);

  return (
    <div className="bg-bg-base">
      <ReadingProgress />
      <div className="mx-auto max-w-7xl px-5 md:px-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
        <div className="hidden pt-24 lg:block">
          <Toc />
        </div>
        <article className="min-w-0 max-w-[720px]">
          <GuiaHero />
          <SectionIsencoes />
          <SectionIpva />
          <SectionQuemPode />
          <SectionCarro />
          <SectionEtapas />
          <SectionPrazos />
          <SectionFaq />
          <FinalCtaBanner />
        </article>
      </div>
    </div>
  );
}
