import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Hero from '../sections/Hero';
import StatsBar from '../sections/StatsBar';
import PainPoints from '../sections/PainPoints';
import Features from '../sections/Features';
import HowItWorks from '../sections/HowItWorks';
import MarketPrice from '../sections/MarketPrice';
import Pricing from '../sections/Pricing';
import TestimonialsNew from '../sections/TestimonialsNew';
import BeforeAfter from '../sections/BeforeAfter';
import FinalCTA from '../sections/FinalCTA';
import PeopleAlsoAsk from '../sections/PeopleAlsoAsk';
import Footer from '../components/Footer';

import ComparisonTable from '../sections/ComparisonTable';
import StickyCTA from '../components/StickyCTA';
import { useSiteConfig } from '@/lib/hooks/useSiteConfig';

const LandingPage = () => {
  const [activeRole, setActiveRole] = useState('peternak');
  const { data: cfg = {} } = useSiteConfig();

  const hubSchema = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://ternakos.my.id/#website",
      "url": cfg.company_url ?? "https://ternakos.my.id",
      "name": cfg.company_name ?? "TernakOS",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://ternakos.my.id/faq?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://ternakos.my.id/#organization",
      "name": cfg.company_name ?? "TernakOS",
      "url": cfg.company_url ?? "https://ternakos.my.id",
      "logo": cfg.company_logo_url ?? "https://ternakos.my.id/logo.png",
      "description": cfg.company_description ?? "Platform SaaS manajemen peternakan #1 di Indonesia yang mendukung peternak sapi potong, domba, kambing, broiler, broker ayam, broker telur, agen sembako, dan RPA. Fitur: batch fattening, ADG, FCR, piutang, laporan laba-rugi, dan monitoring harga pasar real-time.",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": cfg.company_phone ?? "+6281358925505",
        "contactType": "customer service",
        "areaServed": "ID",
        "availableLanguage": "Indonesian"
      },
      "sameAs": [
        cfg.instagram_url ?? "https://instagram.com/ternakos.id",
        cfg.linkedin_url ?? "https://linkedin.com/company/ternakos"
      ].filter(Boolean)
    }
  ];

  return (
    <div className="bg-bg-base min-h-screen text-text-primary font-body overflow-x-hidden">
      <SEO
        title="TernakOS - Platform Manajemen Peternakan Sapi, Domba, Kambing, Broiler & Broker #1 Indonesia"
        description="TernakOS mendukung semua jenis peternakan: sapi potong, domba, kambing, broiler, broker ayam, broker telur, agen sembako, dan RPA. Kelola batch, ADG, FCR, piutang, dan laporan keuangan dari HP. Paket Starter GRATIS selamanya."
        path="/"
        schema={hubSchema}
      />
      <Navbar />
      <Hero />
      <StatsBar />
      <PainPoints activeRole={activeRole} setActiveRole={setActiveRole} />
      <BeforeAfter activeRole={activeRole} />
      <ComparisonTable />
      <Features activeRole={activeRole} />
      <HowItWorks activeRole={activeRole} />
      <MarketPrice activeRole={activeRole} />
      <Pricing activeRole={activeRole} setActiveRole={setActiveRole} />
      <TestimonialsNew />
      <PeopleAlsoAsk />
      <FinalCTA />
      <Footer />
      <StickyCTA />
    </div>
  );
};

export default LandingPage;
