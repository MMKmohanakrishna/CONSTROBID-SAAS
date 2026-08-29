import React from 'react';
import { Shield } from 'lucide-react';

const constructionBg = new URL('../../assets/Construction-bg.png', import.meta.url);
const logoImg = new URL('../../assets/Logo-B&W.png', import.meta.url);

export default function LeftMarketingPanel() {
  return (
    <div className="hidden md:flex flex-col justify-center p-16 text-white relative h-screen overflow-hidden md:sticky md:top-0 md:self-start">
      <div className="absolute inset-0">
        <img src={constructionBg.href} alt="Construction Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(40,0,15,0.82)] to-[rgba(25,0,10,0.92)]" />
      </div>
      <div className="absolute inset-0 bg-[#7A002C]/55"></div>
      <div className="relative z-10 mb-23">
        <img src={logoImg.href} alt="ConstroBID" className="w-[300px] h-auto object-contain" />
      </div>

      <h1 className="relative z-10 text-5xl font-bold leading-tight mb-6 text-white">India's Smart Construction Management Platform</h1>
      <p className="relative z-10 text-xl text-white/90 mb-8">Streamlining construction projects, contractor management, and inspections with transparency and efficiency.</p>

      <div className="relative z-10 grid grid-cols-2 gap-4 mt-12">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3">
          <Shield className="text-white" />
          <div className="text-sm font-semibold">Verified Contractors</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-white"><path d="M3 7h18M6 11h12M9 15h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          <div className="text-sm font-semibold">Transparent Bidding</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-white"><path d="M3 7h18M5 12h14M7 17h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          <div className="text-sm font-semibold">Quality Inspections</div>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-white"><path d="M3 21v-6l6-6 6 6 6-6v12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          <div className="text-sm font-semibold">Real-time Tracking</div>
        </div>
      </div>
    </div>
  );
}
