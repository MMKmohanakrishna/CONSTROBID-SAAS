'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Droplet,
  FileCheck2,
  Hammer,
  Home as HomeIcon,
  Mail,
  LayoutDashboard,
  MapPin,
  Menu,
  Paintbrush,
  Phone,
  Search,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  X,
  LogOut,
  Zap,
} from 'lucide-react';
import interiorImg from '../../assets/Interior Design.png';
import civilImg from '../../assets/Civil Construction.png';
import plumbingImg from '../../assets/Plumbing.png';
import electricalImg from '../../assets/Electrical.png';
import paintingImg from '../../assets/Painting.png';
import carpentryImg from '../../assets/Carpentry.png';
import logoImg from '../../assets/Logo.png';
import LogoImg from '../../assets/Logo-B&W.png';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import ChatBubble from '../components/ChatBubble';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

function CountUpStat({ value, suffix = '+', label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let frame = 0;
    const totalFrames = 70;
    const counter = window.setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setCount(Math.round(value * progress));

      if (frame >= totalFrames) {
        window.clearInterval(counter);
        setCount(value);
      }
    }, 18);

    return () => window.clearInterval(counter);
  }, [isInView, value]);

  return (
    <div ref={ref} className="rounded-lg border border-white/70 bg-white/80 p-6 text-center shadow-lg shadow-primary/5 backdrop-blur-xl">
      <div className="text-3xl font-bold text-primary font-sans">
        {count.toLocaleString('en-IN')}
        {suffix}
      </div>
      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-500">{label}</div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactSending) return;
    setContactError('');
    setContactSending(true);
    try {
      await apiRequest('/support', {
        method: 'POST',
        body: JSON.stringify({
          name: contactName.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
          message: contactMessage.trim(),
        }),
      });
      setContactSent(true);
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setContactMessage('');
    } catch (err: any) {
      setContactError(err?.message || 'Could not send your message. Please try again.');
    } finally {
      setContactSending(false);
    }
  };

  const navLinks = [
    { label: 'Home', id: 'hero' },
    { label: 'Services', id: 'services' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Reviews', id: 'testimonials' },
    { label: 'Contact Us', id: 'contact' },
  ];

  const trustBadges = ['Verified Contractors', 'Site Inspection', 'Design Approved', 'Project Monitoring'];


  const services = [
    { title: 'Interior Design', desc: 'Premium modular kitchens, custom wardrobes, lighting plans, false ceiling, and functional layouts.', icon: Paintbrush, image: interiorImg },
    { title: 'Civil Construction', desc: 'New builds, structural work, masonry, foundations, and end-to-end residential execution.', icon: HomeIcon, image: civilImg },
    { title: 'Plumbing', desc: 'Sanitary fittings, pipelines, leakage tracking, drainage mapping, and quality material checks.', icon: Droplet, image: plumbingImg },
    { title: 'Electrical', desc: 'Wiring maps, switchboards, lighting fixtures, load planning, and verified installation teams.', icon: Zap, image: electricalImg },
    { title: 'Painting', desc: 'Premium emulsions, textures, waterproofing, wall preparation, and finish inspections.', icon: Wrench, image: paintingImg },
    { title: 'Carpentry', desc: 'Woodwork, modular furniture, display panels, doors, storage systems, and repair work.', icon: Hammer, image: carpentryImg },
  ];

  const steps = [
    { title: 'Post Requirement', desc: 'Share your project needs, city, budget, and timeline.', icon: ClipboardList },
    { title: 'Site Inspection', desc: 'Our inspection team captures measurements and site conditions.', icon: Search },
    { title: 'Design Creation', desc: 'Technical design scope is prepared for bidding.', icon: FileCheck2 },
    { title: 'Contractor Bidding', desc: 'Verified contractors submit transparent quotations.', icon: Users },
    { title: 'Project Monitoring', desc: 'Milestones, site updates, and quality checks stay visible.', icon: BarChart3 },
    { title: 'Completion & Review', desc: 'Final verification happens before handover and review.', icon: BadgeCheck },
  ];

  const whyChoose = [
    { title: 'Verified Contractors', desc: 'Every contractor is document-verified before bidding.', icon: Shield },
    { title: 'Inspection Team', desc: 'Independent project verification before and during execution.', icon: ClipboardCheck },
    { title: 'Transparent Quotations', desc: 'Compare multiple contractor bids with clear scope visibility.', icon: FileCheck2 },
    { title: 'Project Monitoring', desc: 'Track progress, site updates, milestones, and quality checks.', icon: BarChart3 },
    { title: 'Quality Assurance', desc: 'Final verification before project completion and handover.', icon: CheckCircle2 },
  ];

  const contractorBenefits = [
    { title: 'More Leads', desc: 'Access homeowners with active project requirements.', icon: TrendingUp },
    { title: 'Verified Projects', desc: 'Bid on inspected and scope-approved projects.', icon: BadgeCheck },
    { title: 'Easy Quotation Submission', desc: 'Submit structured bids against clear project requirements.', icon: FileCheck2 },
    { title: 'Portfolio Showcase', desc: 'Build credibility with previous work and ratings.', icon: BriefcaseBusiness },
    { title: 'Performance Tracking', desc: 'Monitor wins, completion history, and client feedback.', icon: BarChart3 },
  ];

  const testimonials = [
    {
      quote: 'ConstroBID gave us reviewed designs before bidding started. The quotations finally made sense, and the inspection updates helped us stay confident through the full interior project.',
      name: 'Ramesh Sharma',
      role: 'Client, Bengaluru',
      photo: 'RS',
    },
    {
      quote: 'As a contractor, I spend less time chasing unclear leads. Projects arrive with site details and scope, so my team can quote accurately and win better work.',
      name: 'Karan Mehta',
      role: 'Partner Contractor',
      photo: 'KM',
    },
    {
      quote: 'The platform made renovation less stressful. We could compare bids, follow progress, and wait for final quality verification before marking the project complete.',
      name: 'Priya Nair',
      role: 'Client, Mumbai',
      photo: 'PN',
    },
  ];
  
  const faqs = [
    {
      question: 'How does ConstroBID work?',
      answer: 'You post your requirement, ConstroBID coordinates inspection and design review, verified contractors bid, and the project is monitored until completion.',
    },
    {
      question: 'How are contractors verified?',
      answer: 'Contractors are checked using business documents, identity details, portfolio information, service categories, and operational city coverage.',
    },
    {
      question: 'Is inspection mandatory?',
      answer: 'Inspection is recommended for accurate designs, transparent bidding, and smoother execution. It helps contractors quote on the same verified scope.',
    },
    {
      question: 'How does bidding work?',
      answer: 'Once the design is approved, verified contractors submit quotations. You can compare scope, price, timeline, and contractor profile before selection.',
    },
    {
      question: 'What happens after project completion?',
      answer: 'The completion is reviewed, quality checks are recorded, and the homeowner can submit feedback before the project is closed.',
    },
  ];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % testimonials.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [testimonials.length]);

  const activeReview = testimonials[activeTestimonial];

  useEffect(() => {
  const handleScroll = () => {
    const sections = [
      "hero",
      "services",
      "how-it-works",
      "testimonials",
      "contact",
    ];

    const scrollPosition = window.scrollY + 150;

    for (const sectionId of sections) {
      const section = document.getElementById(sectionId);

      if (
        section &&
        scrollPosition >= section.offsetTop &&
        scrollPosition < section.offsetTop + section.offsetHeight
      ) {
        setActiveTab(sectionId);
        break;
      }
    }
  };

  window.addEventListener("scroll", handleScroll);

  handleScroll();

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const postRequirement = () => {
    if (user && user.role === 'CLIENT') router.push('/client/dashboard?tab=create-project');
    else router.push('/auth/login?redirect=create-project');
  };

  return (
    <div className="min-h-screen bg-white text-brand-dark flex flex-col font-sans">
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-6">
        <div className="w-full max-w-7xl h-[74px] rounded-full border border-white/20 bg-white/15 backdrop-blur-xl shadow-xl">
          <div className="flex h-full items-center justify-between px-8">
            <Link href="/" className="flex items-center gap-3 shrink-0">
  <Image
    src={logoImg}
    alt="CONSTROBID logo"
    width={180}
    height={42}
    className="object-contain"
  />
</Link>

<nav className="hidden lg:flex flex-1 justify-center">
  {navLinks.map((link) => (
    <button
      key={link.label}
      onClick={() => scrollToSection(link.id)}
      className={`relative px-8 py-3 text-[15px] font-medium transition-all duration-300 ${
  activeTab === link.id
    ? "text-[#70153A]"
    : "text-[#222] hover:text-[#70153A]"
}`}
    >
      {link.label}

      {activeTab === link.id && (
        <motion.div
  layoutId="navbar-indicator"
  className="absolute bottom-1 left-[30%] h-[3px] w-10 -translate-x-1/2 rounded-full bg-[#F4C542]"
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 30,
          }}
        />
      )}
    </button>
  ))}
</nav>
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {user ? (
                <>
                  <button
  onClick={() => {
    if (user.role === "CLIENT") router.push("/client/dashboard");
    else if (user.role === "CONTRACTOR") router.push("/contractor/dashboard");
    else if (user.role === "INSPECTION_TEAM" || user.role === "INSPECTOR")
      router.push("/inspection/dashboard");
    else if (user.role === "ADMIN") router.push("/admin/dashboard");
  }}
  className="inline-flex items-center gap-2 rounded-full bg-[#70153A] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(112,21,58,0.22)] transition-all duration-300 hover:shadow-[0_24px_45px_rgba(112,21,58,0.28)]"
>
  <LayoutDashboard size={18} />
  <span>Go to Dashboard</span>
</button>
                  <button onClick={logout} className="text-sm font-semibold text-[#fdfcfc] transition-colors hover:text-[#70153A] flex items-center justify-center gap-2">
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-[#111111] transition-all duration-300 hover:bg-white/20">
                    Login
                  </Link>
                  <Link href="/auth/register" className="rounded-full bg-gradient-to-r from-[#70153A] to-[#8C1D49] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(112,21,58,0.22)] transition-all duration-300 hover:scale-[1.01]">
                    Register
                  </Link>
                </>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-[#111111] transition-colors hover:text-[#70153A]" aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      <section
  id="hero"
  className="relative min-h-screen pt-28 overflow-visible"
>
        <div className="absolute inset-0">
          <div className="hidden sm:block absolute inset-0">
            <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
              <source src="/videos/hero.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="sm:hidden absolute inset-0">
            <Image src="/images/hero-mobile.png" alt="ConstroBID hero" fill className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/30 to-transparent" />
        </div>

        <div className="relative z-20 mx-auto flex min-h-[calc(100vh-140px)] max-w-7xl px-6 lg:px-12 items-center">
         <motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
  className="max-w-2xl space-y-6 lg:-mt-16"
>
  
  {/* Heading */}
  <motion.div
    variants={fadeUp}
    className="space-y-4"
  >
   <h1
  className="
    font-serif

    text-[32px]
    sm:text-[36px]
    md:text-[42px]
    lg:text-[46px]
    xl:text-[50px]

    leading-[1.05]

    font-bold

    tracking-[-0.02em]

    text-white
  "
>
  From Inspection
  <br />
  to Completion.

  <span className="block mt-2 text-[#F9C151]">
    One Platform.
    <br />
    Zero Guesswork.
  </span>
</h1>

    <p
      className="
        max-w-xl

        text-lg

        leading-8

        text-white/80
      "
    >
      ConstroBID connects homeowners with verified
      contractors through professional inspections,
      transparent bidding, BOQ creation, and project
      monitoring—all on one platform.
    </p>
  </motion.div>

  {/* Buttons */}
  <motion.div
    variants={fadeUp}
    className="flex flex-wrap gap-4 pt-2"
  >
    <motion.button
      whileHover={{
        scale: 1.04,
        y: -2
      }}
      whileTap={{
        scale: 0.98
      }}
      onClick={postRequirement}
      className="
        inline-flex
        items-center
        gap-3

        rounded-full

        bg-gradient-to-r
        from-[#70153A]
        to-[#8C1D49]

        px-7
        py-3.5

        text-sm
        font-semibold

        text-white

        shadow-[0_20px_50px_rgba(112,21,58,.35)]
      "
    >
      <ClipboardList size={18} />

      Post Your Requirement

    </motion.button>

    <motion.button
      whileHover={{
        scale: 1.04,
        y: -2
      }}
      whileTap={{
        scale: 0.98
      }}
      onClick={() =>
        router.push('/auth/register?role=CONTRACTOR')
      }
      className="
        inline-flex
        items-center
        gap-3

        rounded-full

        border
        border-white/20

        bg-white/10

        backdrop-blur-xl

        px-7
        py-3.5

        text-sm
        font-semibold

        text-white

        hover:bg-white/15

        transition-all
      "
    >
      <UserCheck size={18} />

      Become a Contractor

    </motion.button>
  </motion.div>
</motion.div>
            
        </div>

    
      </section>
      
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="lg:hidden fixed left-0 right-0 top-20 z-40 bg-white/15 backdrop-blur-xl border border-white/20 shadow-[0_40px_80px_rgba(0,0,0,0.18)] rounded-b-3xl px-4 pt-2 pb-6 space-y-3"
          >
            {navLinks.map((link) => (
              <button key={link.label} onClick={() => scrollToSection(link.id)} className="block w-full text-left py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-red-50/50 hover:text-primary rounded-lg transition-colors">
                {link.label}
              </button>
            ))}
            <hr className="border-white/20 my-2" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (user.role === 'CLIENT') router.push('/client/dashboard');
                      else if (user.role === 'CONTRACTOR') router.push('/contractor/dashboard');
                      else if (user.role === 'INSPECTION_TEAM' || user.role === 'INSPECTOR') router.push('/inspection/dashboard');
                      else if (user.role === 'ADMIN') router.push('/admin/dashboard');
                    }}
                    className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover text-center"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover text-center flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="py-2.5 border border-primary text-primary text-sm font-semibold rounded-lg hover:bg-red-50/50 text-center">
                    Login
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)} className="py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover text-center">
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      

      <section id="services" className="py-20 bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Our Services</div>
              <h2 className="mt-2 text-2xl lg:text-3xl font-extrabold text-[#6b0f1a]">Construction and Interior Services, Verified</h2>
            </div>
            <div>
              <button onClick={() => router.push('/services')} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-semibold text-[#6b0f1a] hover:bg-[#fff1f3] transition">
                View All Services
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc, index) => (
              <motion.div key={svc.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: index * 0.05 }} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-transform hover:-translate-y-1">
                <div className="relative h-44 bg-gray-100">
                  {svc.image ? (
                    <Image src={svc.image} alt={svc.title} fill className="object-cover object-center" />
                  ) : (
                    <div className="absolute inset-0 bg-[url('/images/services/service_placeholder.jpg')] bg-center bg-cover" />
                  )}
                </div>

                <div className="p-6">
                  <div className="-mt-5 mb-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm">
                      <svc.icon size={18} className="text-[#6b0f1a]" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">{svc.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{svc.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
  id="how-it-works"
  className="relative py-24 bg-white border-t border-gray-100 overflow-hidden"
>
  {/* Left Background Shape */}
  <div className="absolute left-0 top-0 h-full w-[320px] lg:w-[450px] opacity-10 z-0 bg-left-shape" />

  {/* Right Background Shape */}
  <div className="absolute right-0 top-0 h-full w-[320px] lg:w-[450px] opacity-10 z-0 bg-right-shape" />

  <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full relative z-10">

    {/* Heading */}
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
      className="text-center max-w-4xl mx-auto mb-20"
    >
      <motion.span
        variants={fadeUp}
        className="text-xs font-bold text-primary tracking-[0.25em] uppercase block"
      >
        How ConstroBID Works
      </motion.span>

      <motion.h2
        variants={fadeUp}
        className="mt-4 text-4xl lg:text-5xl font-extrabold text-primary font-serif leading-tight"
      >
        A Clear Workflow From Requirement to Handover
      </motion.h2>

      <motion.p
        variants={fadeUp}
        className="mt-5 text-lg text-gray-600 leading-relaxed"
      >
        A managed construction marketplace needs visible processes.
        Every stakeholder stays aligned from inspection to project
        completion.
      </motion.p>
    </motion.div>

    {/* Timeline */}
    <div className="relative">

      {/* Timeline Line */}
      <div className="hidden lg:block absolute top-[58px] left-[8%] right-[8%] h-[4px] rounded-full bg-gradient-to-r from-[#6B0F1A] via-[#D4A24C] to-[#6B0F1A]" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">

        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-md transition-all duration-300 hover:-translate-y-3 hover:border-secondary hover:shadow-2xl hover:shadow-primary/20"
          >
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0 bg-gradient-to-t from-secondary/20 to-transparent transition-all duration-500 group-hover:h-full" />

            {/* Icon */}
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-secondary bg-white text-primary shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary/30">
              <step.icon size={24} />
            </div>

            {/* Step */}
            <div className="relative mt-5 text-xs font-extrabold uppercase tracking-[0.2em] text-secondary transition-colors duration-300 group-hover:text-primary">
              Step {index + 1}
            </div>

            {/* Title */}
            <h3 className="relative mt-2 text-base font-extrabold text-primary leading-snug">
              {step.title}
            </h3>

            <span className="relative mx-auto mt-3 block h-0.5 w-0 rounded-full bg-secondary transition-all duration-300 group-hover:w-10" />

            {/* Description */}
            <p className="relative mt-3 text-sm text-gray-600 leading-relaxed transition-colors duration-300 group-hover:text-gray-800">
              {step.desc}
            </p>

          </motion.div>
        ))}

      </div>
    </div>

  </div>
</section>

      <section id="testimonials" className="relative overflow-hidden bg-[#fbfafc] py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold text-[#6b0f1a] tracking-widest uppercase block">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#6b0f1a] font-serif">Trusted by Homeowners and Contractors</h2>
          </div>

          <div className="flex min-h-[394px] items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeReview.name}
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="flex min-h-[360px] w-full max-w-[470px] flex-col rounded-[18px] border border-[#f3eef0] bg-white p-8 shadow-[0_20px_50px_rgba(38,20,30,0.07)] sm:min-h-[394px] sm:p-10"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={19}
                          strokeWidth={2.5}
                          className="fill-[#fbb51c] text-[#fbb51c]"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-5xl leading-none text-gray-300">“</div>
                </div>

                <p className="mt-4 flex-1 text-[17px] leading-[1.9] text-[#526071]">{activeReview.quote}</p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f5e8eb] text-lg font-bold text-[#70153A]">{activeReview.photo}</div>
                  <div>
                    <div className="text-base font-bold text-[#1f2937]">{activeReview.name}</div>
                    <div className="mt-1 text-sm text-[#7b8794]">{activeReview.role}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} className={`h-3 w-3 rounded-full transition-all duration-300 ${activeTestimonial === i ? 'w-10 bg-[#70153A]' : 'bg-[#d9bfc7] hover:bg-[#bd9aa6]'}`} aria-label={`Show testimonial ${i + 1}`} aria-current={activeTestimonial === i ? 'true' : undefined} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ section removed as requested */}

      <section id="contact" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4">
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase block">GET IN TOUCH</span>
                  <h3 className="text-2xl lg:text-3xl font-bold text-[#6b0f1a]">We're Here to Help</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Have questions about scheduling inspections or contractor verification? Write to our support managers or call us.</p>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    { label: 'Email Support', value: 'Anirban@constrobid.com', icon: Mail },
                    { label: 'Office Address', value: '12th Floor, Trade Towers, Outer Ring Road, Bangalore, India', icon: MapPin },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-[#6b0f1a] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <item.icon size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-700">{item.label}</div>
                        <div className="text-sm font-bold text-gray-900 mt-1">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4">
              </div>

              <form className="lg:col-span-4 bg-transparent p-0" onSubmit={handleContactSubmit}>
                <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
                  {contactSent ? (
                    <div className="rounded-md border border-green-200 bg-green-50 p-6 text-center">
                      <p className="text-sm font-bold text-green-800">Message sent — thank you!</p>
                      <p className="mt-1 text-sm text-green-700">Our team will get back to you shortly.</p>
                      <button
                        type="button"
                        onClick={() => setContactSent(false)}
                        className="mt-4 text-xs font-semibold text-[#6b0f1a] hover:underline"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <>
                      {contactError && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                          {contactError}
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block">Your Name</label>
                          <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Enter name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#6b0f1a]" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 block">Phone Number</label>
                          <input type="tel" required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Enter phone" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#6b0f1a]" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="text-xs font-semibold text-gray-500 block">Email Address</label>
                        <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Enter email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#6b0f1a]" />
                      </div>
                      <div className="mt-4">
                        <label className="text-xs font-semibold text-gray-500 block">Your Query</label>
                        <textarea rows={4} required value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder="Describe your requirements or questions..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#6b0f1a] resize-none" />
                      </div>
                      <button type="submit" disabled={contactSending} className="mt-5 w-full py-3.5 bg-[#6b0f1a] text-white text-sm font-bold rounded-md hover:bg-[#5a0c15] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                        {contactSending ? 'Sending...' : 'Send Message'}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto bg-[#6b0f1a] text-white py-5 border-t border-[#5a0c15]">
        <div className="max-w-10xl mx-auto px-6 lg:px-20 w-full grid grid-cols-1 md:grid-cols-4 gap-10 pt-8 ">
          <div className="space-y-3">
            <Image src={LogoImg} alt="CONSTROBID logo" width={220} height={48} className="object-contain" />
            <p className="text-sm text-[#ffecec] leading-relaxed pt-2">India's inspection-managed construction and interior design marketplace connecting homeowners with verified builders.</p>

            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://www.instagram.com/constrobid?utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ConstroBID on Instagram"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#ffd9d9] mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm text-[#ffecec]">
              <li><button onClick={() => scrollToSection('hero')} className="hover:text-white transition-colors">Home</button></li>
              <li><button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">Services Directory</button></li>
              <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
              <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">Client Reviews</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#ffd9d9] mb-4 uppercase tracking-wider">Legal Terms</h4>
            <ul className="space-y-2 text-sm text-[#ffecec]">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full mt-5 pt-1 border-t border-[#5a0c15] text-center text-sm text-[#ffd9d9]">
          <div>&copy; {new Date().getFullYear()} ConstroBID Technologies Pvt. Ltd. All rights reserved.</div>
          <div className="pt-3">Designed &amp; Developed by Mohana Krishna</div>
        </div>
      </footer>
      {/* Chatbot hidden for now — re-enable by uncommenting <ChatBubble />. */}
    </div>
  );
}
