import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Building,
  BarChart3,
  Layers,
  Zap,
  Sparkles,
  ShieldCheck,
  Check,
  Star,
  ArrowRight,
  IndianRupee,
  Users,
  Clock,
  UserPlus,
  MessageSquare,
  Bot,
  Calendar,
  CheckSquare2,
  TrendingUp,
  Award,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  Headphones
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* 1. Header Navigation - Crisp Light Surface Matching Topbar with Dark Mode */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shadow-2xs transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo - Exact Match to Dashboard Sidebar */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:from-blue-500 group-hover:to-indigo-500 transition-smooth">
              TF
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none block">
                TaxFlow
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                Tax & Audit Suite
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-smooth">
              Features
            </a>
            <a href="#preview" className="hover:text-blue-600 dark:hover:text-blue-400 transition-smooth">
              Live Preview
            </a>
            <a href="#workflow" className="hover:text-blue-600 dark:hover:text-blue-400 transition-smooth">
              Why TaxFlow
            </a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-smooth">
              Pricing
            </a>
            <a href="#testimonials" className="hover:text-blue-600 dark:hover:text-blue-400 transition-smooth">
              Reviews
            </a>
          </nav>

          {/* Nav Actions with Theme Toggle */}
          <div className="flex items-center space-x-3">
            <ThemeToggle size="sm" />
            <button
              onClick={() => navigate("/login?mode=login")}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 transition-smooth"
            >
              Login
            </button>
            <Button
              size="sm"
              onClick={() => navigate("/login?mode=signup")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm px-4"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section - Premium Light/Dark SaaS with Ambient Gradient */}
      <section className="relative pt-16 pb-20 px-6 text-center overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          {/* Announcement Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>TaxFlow — The Modern Tax & Audit Suite for Indian CAs</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Automate Your Practice. <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-400 dark:to-sky-400 bg-clip-text text-transparent">
              Deliver 3x Faster Client Filings.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            All-in-one compliance, GST, ITR, document repository, automated WhatsApp client reminders,
            and billing ledger engineered specifically for Indian CA practices.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/login?mode=signup")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 px-7 py-3 text-sm"
            >
              Start Free Trial
            </Button>

            <a
              href="#preview"
              className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-750 text-sm font-semibold shadow-2xs transition-smooth"
            >
              Live Dashboard Preview
            </a>
          </div>

          {/* Sub-text notice */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-2">
            No credit card required · Starter plan from ₹499/month · Production ready
          </p>

          {/* Trust Highlights Bar */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">100% Indian Cloud</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Data residency compliant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">ISO 27001 Security</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">256-bit bank encryption</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Auto-Due Tracker</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Zero missed GST/ITR dates</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <Star className="w-4 h-4 text-amber-500 flex-shrink-0 fill-amber-500" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">4.9 / 5 Rating</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Over 1,200+ CA firms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Dashboard Preview Section */}
      <section id="preview" className="py-16 px-6 bg-slate-100/70 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase tracking-wider">
              AUTHENTIC DASHBOARD INTERFACE
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Designed for Speed, Clarity, and Control
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
              The unified practice dashboard where your team manages filings, clients, and revenue.
            </p>
          </div>

          {/* Interactive Mockup Container */}
          <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 sm:p-4 shadow-xl overflow-hidden transition-colors">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-4 bg-slate-50 dark:bg-slate-850 rounded-t-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 ml-2">
                  app.taxflow.com/dashboard
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  ● Live Demo Preview
                </span>
              </div>
            </div>

            {/* Dashboard Inner Canvas Preview */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 sm:p-6 text-slate-900 dark:text-slate-100 space-y-6 border border-slate-200 dark:border-slate-800 transition-colors">
              {/* Dashboard Welcome Header (Navy Banner) */}
              <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Welcome back, Super Admin 👋
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Here's what's happening across your CA practice today. All returns, documents, and payments are up to date.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs">
                    + Add Client
                  </span>
                  <span className="px-3 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-blue-400" />
                    Ask AI
                  </span>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Revenue */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-smooth">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Revenue</span>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">₹3,85,000</span>
                    <div className="flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +18.4% vs last month
                    </div>
                  </div>
                </div>

                {/* 2. Active Clients */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-smooth">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Clients</span>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">48</span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                      Active client accounts
                    </p>
                  </div>
                </div>

                {/* 3. Pending Filings */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-amber-300 dark:hover:border-amber-700 transition-smooth">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Filings</span>
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">12</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Requires action</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">• 2 overdue</span>
                    </div>
                  </div>
                </div>

                {/* 4. Total Leads */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 transition-smooth">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Leads</span>
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg">
                      <UserPlus className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">19</span>
                    <div className="flex items-center text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +6 new this month
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Quick Task Bar */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <CheckSquare2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Live Task Dashboard</span>
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        14/16 completed
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Daily priorities & pending actions for your firm
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-64 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <span>Daily Progress</span>
                    <span className="text-blue-600 dark:text-blue-400 font-bold">88%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" style={{ width: "88%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid Section */}
      <section id="features" className="py-20 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase tracking-wider">
              FULL PRACTICE COMPLIANCE
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engineered for Every CA Practice Workflow
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Replace fragmented spreadsheets and disconnected tools with a unified practice command center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: GST Filing */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">GST Returns & Auto-Reconciliation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Streamline GSTR-1, GSTR-3B, and GSTR-9 filings with instant mismatch identification,
                penalty tracker, and period-wise status.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                GSTR-1 · GSTR-3B · GSTR-9
              </div>
            </div>

            {/* Card 2: ITR Filing */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">ITR Processing & Tax Computation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Support for ITR-1 to ITR-7, assessment year tracking, tax computation summaries, and
                instant verification status logs.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                ITR-1 through ITR-7 · AY 2024-25 Ready
              </div>
            </div>

            {/* Card 3: Client CRM & Document Vault */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Client CRM & Digital Document Center</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Manage active clients and prospective leads with PAN, Aadhaar, GSTIN credentials, and
                encrypted cloud storage for easy audits.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                PAN / Aadhaar / GSTIN Cloud Vault
              </div>
            </div>

            {/* Card 4: WhatsApp Automation */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp Hub & Automated Alerts</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Send due-date reminders, payment requests, and tax filing confirmations to clients via
                pre-formatted WhatsApp templates with 1-click.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                Instant WhatsApp Web & API Integration
              </div>
            </div>

            {/* Card 5: Billing & Invoicing */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Billing, Payments & TDS Ledger</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate professional CA invoices, track outstanding fees, integrate Razorpay links, and
                monitor practice revenue analytics in real-time.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                GST Compliant Invoicing · Razorpay Ready
              </div>
            </div>

            {/* Card 6: AI Assistant */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Practice Assistant & OCR</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Get instant answers on Income Tax sections, GST circulars, draft client response letters,
                and auto-extract data from financial documents.
              </p>
              <div className="pt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                Indian Tax Regulations & Document OCR
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why TaxFlow Workflow Comparison Section */}
      <section id="workflow" className="py-20 px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Transform How Your Firm Operates
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
              See the difference between manual spreadsheet chaos and automated practice excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* The Old Way */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>The Traditional Practice</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Scattered Excel sheets and lost client password notebooks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Manual phone calls chasing clients for missing bank statements</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Missed GST return dates causing avoidable client penalties</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Uncollected invoices and unclear outstanding fee tracking</span>
                </li>
              </ul>
            </div>

            {/* The TaxFlow Way */}
            <div className="p-7 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 shadow-md space-y-4 transition-colors">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>With TaxFlow Automation</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Centralized, encrypted client vault with PAN, GSTIN & KYC records</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Automated WhatsApp reminders sent in 1-click to all pending clients</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Live visual dashboard highlighting upcoming and overdue returns</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Instant payment links via Razorpay with automated fee reconciliation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold uppercase tracking-wider">
              PRICING PLANS
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Simple, Transparent Pricing for Every Firm Size
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Start small, scale as your client base expands. No hidden charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Tier 1: Starter CA Plan */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  STARTER CA PLAN
                </span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹499</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Perfect launch plan for individual CAs & boutique practitioners
                </p>
              </div>

              <Button
                onClick={() => navigate("/login?mode=signup")}
                variant="outline"
                className="w-full text-slate-700 dark:text-slate-200 font-bold py-2.5 text-xs rounded-lg border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Get Started
              </Button>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Up to 10 clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>1 CA Admin account</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>ITR & GST return tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Document upload & PAN/Aadhaar vault</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>WhatsApp Web reminder links</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>100 AI queries/month</span>
                </div>
              </div>
            </div>

            {/* Tier 2: Growth CA Plan (Highlighted) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border-2 border-blue-600 dark:border-blue-500 relative space-y-6 shadow-xl ring-4 ring-blue-50 dark:ring-blue-950/40 transition-colors">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Most Popular
              </span>

              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  GROWTH CA PLAN
                </span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹999</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  For growing practices managing multiple clients and team staff
                </p>
              </div>

              <Button
                onClick={() => navigate("/login?mode=signup")}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 text-xs rounded-lg shadow-md shadow-blue-600/20"
              >
                Start Free Trial
              </Button>

              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Up to 50 clients</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>1 CA Admin + 1 Staff User</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>500 WhatsApp automated reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Automated Razorpay fee links</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>300 AI queries & OCR document processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Priority email & WhatsApp support</span>
                </div>
              </div>
            </div>

            {/* Tier 3: Enterprise Plan */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  FIRM ENTERPRISE
                </span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹2,499</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  For multi-partner firms requiring advanced audit trails & SLA
                </p>
              </div>

              <Button
                onClick={() => navigate("/login?mode=signup")}
                variant="outline"
                className="w-full text-slate-700 dark:text-slate-200 font-bold py-2.5 text-xs rounded-lg border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Contact Sales
              </Button>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Unlimited clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Unlimited staff & role permissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Complete audit log & compliance trails</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Custom domain & branded client portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Trusted by CAs Across India
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
              See what fellow Chartered Accountants say about switching to TaxFlow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <div className="flex text-amber-400 space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                "TaxFlow transformed our practice operations. The WhatsApp reminder hub alone saved our
                team 4 hours a day during July tax rush. Outstanding product."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  S
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">CA Suresh Gupta</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Gupta & Associates, Mumbai</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <div className="flex text-amber-400 space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                "The dashboard is crisp, intuitive, and eliminates missed filing deadlines. The GST
                tracking and client document vault give our clients immense peace of mind."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  P
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">CA Priya Nambiar</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Nambiar Tax Consultants, Bangalore</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
              <div className="flex text-amber-400 space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                "Switching from our old desktop setup was the best decision for our firm. Client billing
                is automated and productivity is up 60%. Highly recommended!"
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  R
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">CA Rohit Agarwal</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Agarwal & Co., New Delhi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Bottom CTA Banner */}
      <section className="py-16 px-6 bg-slate-100 dark:bg-slate-950 transition-colors">
        <div className="max-w-4xl mx-auto rounded-2xl bg-slate-900 dark:bg-slate-900 text-white p-8 md:p-12 text-center space-y-6 shadow-xl border border-slate-800">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Ready to modernise your CA firm?
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto">
            Join thousands of Indian Chartered Accountants streamlining their practice today.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate("/login?mode=signup")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg px-8 py-3 text-sm shadow-md"
            >
              Start Free Trial Now
            </Button>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              TF
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">TaxFlow · Tax & Audit Suite</span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            © 2026 TaxFlow Technologies Pvt Ltd. All rights reserved. GST & Income Tax Portal Compliant.
          </p>

          <div className="flex items-center space-x-6 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-smooth">
              Features
            </a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-smooth">
              Pricing
            </a>
            <button
              onClick={() => navigate("/login?mode=login")}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-smooth"
            >
              Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
