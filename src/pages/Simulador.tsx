import Eyebrow from '@/components/Eyebrow';

/** Stub público — página real implementada pelo agente de página correspondente. */
export function PageStub({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="mx-auto flex min-h-[60dvh] max-w-7xl flex-col items-start justify-center px-5 py-20 md:px-8">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-5 font-display text-[2.6rem] uppercase leading-[0.95] tracking-[-0.01em] md:text-[4rem]">
        {title}
      </h1>
      <p className="mt-4 max-w-lg text-text-muted">{description}</p>
    </section>
  );
}

export default function Simulador() {
  return (
    <PageStub
      eyebrow="Simulador grátis"
      title="Simulador de economia"
      description="Catálogo de 10 carros + calculadora IPI + ICMS. Página em construção."
    />
  );
}
