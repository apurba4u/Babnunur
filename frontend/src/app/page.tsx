import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { TrustedCompanies } from '@/components/landing/trusted-companies';
import { AiFeatures } from '@/components/landing/ai-features';
import { ProductFeatures } from '@/components/landing/product-features';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { Categories } from '@/components/landing/categories';
import { AiAgents } from '@/components/landing/ai-agents';
import { WorkflowSection } from '@/components/landing/workflow-section';
import { Testimonials } from '@/components/landing/testimonials';
import { Pricing } from '@/components/landing/pricing';
import { FAQ } from '@/components/landing/faq';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <Hero />
      <TrustedCompanies />
      <AiFeatures />
      <ProductFeatures />
      <DashboardPreview />
      <Categories />
      <AiAgents />
      <WorkflowSection />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
