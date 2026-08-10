import Hero from '@/components/home/Hero';
import CarMarquee from '@/components/home/CarMarquee';
import MiniSimulator from '@/components/home/MiniSimulator';
import JourneyPin from '@/components/home/JourneyPin';
import StjSection from '@/components/home/StjSection';
import UrgencySection from '@/components/home/UrgencySection';
import PricingSection from '@/components/home/PricingSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import FaqSection from '@/components/home/FaqSection';
import FinalCta from '@/components/home/FinalCta';

export default function Home() {
  return (
    <>
      <Hero />
      <CarMarquee />
      <MiniSimulator />
      <JourneyPin />
      <StjSection />
      <UrgencySection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
