import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Building,
  BarChart3,
  Layers,
  Scale,
  Zap,
  Sparkles,
  ShieldCheck,
  Headphones,
  Check,
  Star,
  ArrowRight
} from "lucide-react";
import { Button } from "../../components/ui/Button";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090d16]/80 border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-violet-900/30">
              T
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">TaxFlow <span className="text-violet-400 font-normal">AI</span></span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-smooth">Features</a>
            <a href="#why-us" className="hover:text-white transition-smooth">Why Us</a>
            <a href="#pricing" className="hover:text-white transition-smooth">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-smooth">Reviews</a>
            <button onClick={() => navigate("/login?mode=login")} className="hover:text-white transition-smooth">Login</button>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/login?mode=login")}
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 transition-smooth"
            >
              Login
            </button>
            <Button
              size="sm"
              onClick={() => navigate("/login?mode=signup")}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-900/40 rounded-xl px-5"
            >
              Try Free
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-violet-950/60 border border-violet-800/50 text-violet-300 text-xs font-semibold shadow-inner">
            <span>🚀</span>
            <span>India's #1 Tax Automation Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Tax Compliance <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
              Made Effortless
            </span>
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Automate GST filing, ITR processing, client reminders and billing for your CA firm. Serve 3x more clients with AI-powered workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/login?mode=signup")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-xl shadow-violet-900/50 rounded-xl px-8 py-3 text-sm font-semibold"
            >
              Start Free Trial
            </Button>

            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-smooth"
            >
              View Demo
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-medium pt-2">
            Starter plan from ₹499/month · 10-client MVP · Upgrade anytime
          </p>
        </div>
      </section>

      {/* 3. Features Grid Section */}
      <section id="features" className="py-20 px-6 border-t border-slate-800/60 bg-[#080c18]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Everything your firm needs
            </h2>
            <p className="text-xs md:text-sm text-slate-400">
              From GST to ITR, we handle it all — so you can focus on advising your clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: GST Filing */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-slate-700 transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-950/60 text-violet-400 flex items-center justify-center border border-violet-800/40">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">GST Filing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                GSTR-1, GSTR-3B, GSTR-9 filing with auto-reconciliation and penalty tracking
              </p>
              <a href="#features" className="inline-flex items-center text-xs font-semibold text-violet-400 hover:text-violet-300 gap-1 pt-2">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Card 2: ITR Filing */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-slate-700 transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-950/60 text-violet-400 flex items-center justify-center border border-violet-800/40">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">ITR Filing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                ITR-1 to ITR-7, capital gains computation, advance tax calculations
              </p>
              <a href="#features" className="inline-flex items-center text-xs font-semibold text-violet-400 hover:text-violet-300 gap-1 pt-2">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Card 3: Company Registration */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-slate-700 transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-950/60 text-violet-400 flex items-center justify-center border border-violet-800/40">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Company Registration</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Private Limited, LLP, OPC, Partnership firm registration end-to-end
              </p>
              <a href="#features" className="inline-flex items-center text-xs font-semibold text-teal-400 hover:text-teal-300 gap-1 pt-2">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Card 4: TDS Compliance */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-slate-700 transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-950/60 text-violet-400 flex items-center justify-center border border-violet-800/40">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">TDS Compliance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                TDS filing, Form 16/16A generation, challan management
              </p>
              <a href="#features" className="inline-flex items-center text-xs font-semibold text-amber-400 hover:text-amber-300 gap-1 pt-2">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Card 5: Accounting */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-slate-700 transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-950/60 text-violet-400 flex items-center justify-center border border-violet-800/40">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Accounting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bookkeeping, P&L, balance sheet, financial reporting automation
              </p>
              <a href="#features" className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 gap-1 pt-2">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Card 6: Tax Audit */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-slate-700 transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-950/60 text-violet-400 flex items-center justify-center border border-violet-800/40">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Tax Audit</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tax audit support, Form 3CD preparation, compliance assistance
              </p>
              <a href="#features" className="inline-flex items-center text-xs font-semibold text-rose-400 hover:text-rose-300 gap-1 pt-2">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Section */}
      <section id="why-us" className="py-20 px-6 bg-[#090d16]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="px-3 py-1 rounded-md bg-violet-950/60 text-violet-400 border border-violet-800/50 text-[10px] font-bold uppercase tracking-wider">
              WHY TAXFLOW AI
            </span>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Built for Indian CA firms, <br />
              by tax experts
            </h2>

            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              We understand the unique challenges of Indian tax compliance. Our platform is built with deep domain knowledge of GST laws, income tax regulations, and MCA requirements.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-slate-800/60 text-violet-400 border border-slate-700/60">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">File 10x Faster</h4>
                  <p className="text-xs text-slate-400">Auto-populate data from previous filings, reducing manual entry by 80%</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-slate-800/60 text-amber-400 border border-slate-700/60">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">AI-Powered Insights</h4>
                  <p className="text-xs text-slate-400">Proactive alerts for deadlines, anomalies, and optimization opportunities</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-slate-800/60 text-emerald-400 border border-slate-700/60">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Bank-Grade Security</h4>
                  <p className="text-xs text-slate-400">256-bit encryption, Indian data residency, ISO 27001 certified</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-xl bg-slate-800/60 text-cyan-400 border border-slate-700/60">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">24/7 Expert Support</h4>
                  <p className="text-xs text-slate-400">Dedicated CA support team available via chat, call, and WhatsApp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Dashboard Mockup */}
          <div className="bg-[#0f172a] rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-500 ml-2">dashboard.taxflow.ai</span>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>GST Filings This Month</span>
                  <span className="font-bold text-violet-400">42 / 48</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-violet-500 h-2 rounded-full" style={{ width: "88%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Revenue Collected</span>
                  <span className="font-bold text-emerald-400">₹3.8L / ₹4.2L</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "90%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Clients Onboarded</span>
                  <span className="font-bold text-cyan-400">284 / 300</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{ width: "94%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Reminders Sent</span>
                  <span className="font-bold text-amber-400">1,247 / 1,300</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: "95%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="py-20 px-6 border-t border-slate-800/60 bg-[#080c18]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-xs md:text-sm text-slate-400">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Starter CA Plan */}
            <div className="p-6 rounded-2xl bg-[#0f172a] border-2 border-violet-600 relative space-y-6 shadow-2xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                Most Popular
              </span>

              <div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">STARTER CA PLAN</span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-white">₹499</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Minimum-cost launch plan for individual CAs</p>
              </div>

              <Button onClick={() => navigate("/login")} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 py-2.5 text-xs font-bold rounded-xl">
                Get Started Free
              </Button>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Up to 10 clients</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>1 CA admin</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Client & Lead Client management</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>PAN, Aadhaar, GST document upload</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>ITR, GST, TDS, Bookkeeping, Audit tracker</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>WhatsApp Web reminders</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Razorpay payment links</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>100 AI answers/month</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>100 OCR pages/month</span></div>
              </div>
            </div>

            {/* Card 2: Starter Yearly */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-slate-800 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STARTER YEARLY</span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-white">₹4,999</span>
                  <span className="text-xs text-slate-400">/year</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Best low-cost yearly plan for first CA users</p>
              </div>

              <button onClick={() => navigate("/login")} className="w-full py-2.5 text-xs font-bold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white transition-smooth">
                Get Started Free
              </button>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Everything in Starter CA Plan</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Save compared to monthly billing</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>500 MB document storage</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Usage dashboard</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Subscription status tracking</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Basic reports</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Email support</span></div>
              </div>
            </div>

            {/* Card 3: Growth CA Plan */}
            <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-slate-800 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GROWTH CA PLAN</span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-white">₹999</span>
                  <span className="text-xs text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Upgrade after product is stable and client count grows</p>
              </div>

              <button onClick={() => navigate("/login")} className="w-full py-2.5 text-xs font-bold rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white transition-smooth">
                Get Started Free
              </button>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Up to 50 clients</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>1 CA admin + 1 staff user</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>1 GB document storage</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>500 WhatsApp reminders/month</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>300 AI answers/month</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>300 OCR pages/month</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Payment dashboard</span></div>
                <div className="flex items-center gap-2 text-emerald-400"><Check className="w-4 h-4 flex-shrink-0" /><span>Priority support</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-[#090d16]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Loved by CA professionals
            </h2>
            <p className="text-xs md:text-sm text-slate-400">Join 5,000+ firms already using TaxFlow AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 space-y-4">
              <div className="flex text-amber-400 space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "TaxFlow AI has transformed our practice. We now handle 3x more clients with the same team. The WhatsApp automation alone saves us 4 hours daily."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  G
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">CA Suresh Gupta</h4>
                  <p className="text-[10px] text-slate-400">Gupta & Associates, Mumbai</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 space-y-4">
              <div className="flex text-amber-400 space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "The AI assistant is incredible. It answers client queries instantly and the GST deadline tracker has eliminated all late filings. Worth every rupee!"
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  N
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">CA Priya Nambiar</h4>
                  <p className="text-[10px] text-slate-400">Nambiar Tax Consultants, Bangalore</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800 space-y-4">
              <div className="flex text-amber-400 space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                "Switching from our old software was the best decision. The CRM + billing integration is seamless. Our team productivity increased by 60%."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  A
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">CA Rohit Agarwal</h4>
                  <p className="text-[10px] text-slate-400">Agarwal & Co., Delhi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-800 bg-[#060911] py-12 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center">
              T
            </div>
            <span className="text-sm font-extrabold text-white">TaxFlow AI</span>
          </div>

          <p className="text-[11px] text-slate-500">© 2026 TaxFlow AI Technologies Pvt Ltd. All rights reserved.</p>

          <div className="flex items-center space-x-6 text-[11px]">
            <a href="#features" className="hover:text-white transition-smooth">Features</a>
            <a href="#pricing" className="hover:text-white transition-smooth">Pricing</a>
            <button onClick={() => navigate("/login")} className="hover:text-white transition-smooth">Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
