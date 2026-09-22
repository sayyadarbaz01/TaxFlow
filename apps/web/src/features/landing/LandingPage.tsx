import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
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
  Sparkles
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { ThemeToggle } from "../../components/ui/ThemeToggle";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-200">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-card/90 border-b border-border px-6 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm transition-smooth group-hover:opacity-90">
              TF
            </div>
            <div>
              <span className="text-sm font-bold text-foreground tracking-tight leading-none block">
                TaxFlow
              </span>
              <span className="text-[10px] text-muted-foreground font-medium block">
                Tax & Audit Suite
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-smooth">
              Features
            </a>
            <a href="#preview" className="hover:text-primary transition-smooth">
              Live Preview
            </a>
            <a href="#workflow" className="hover:text-primary transition-smooth">
              Why TaxFlow
            </a>
            <a href="#pricing" className="hover:text-primary transition-smooth">
              Pricing
            </a>
            <a href="#testimonials" className="hover:text-primary transition-smooth">
              Reviews
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <ThemeToggle size="sm" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login?mode=login")}
              className="text-xs font-semibold"
            >
              Login
            </Button>
            <Button size="sm" onClick={() => navigate("/login?mode=signup")}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 px-6 text-center overflow-hidden bg-background border-b border-border">
        <div className="absolute inset-0 bg-muted/40 pointer-events-none" aria-hidden />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10 animate-fade-in">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-primary-muted/60 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>TaxFlow — The Modern Tax & Audit Suite for Indian CAs</span>
          </div>

          <div className="space-y-4">
            <p className="text-sm md:text-base font-bold text-primary uppercase tracking-[0.12em]">
              TaxFlow
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight leading-[1.12]">
              Automate Your Practice. <br />
              <span className="text-primary">Deliver 3x Faster Client Filings.</span>
            </h1>
          </div>

          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            All-in-one compliance, GST, ITR, document repository, automated WhatsApp client reminders,
            and billing ledger engineered specifically for Indian CA practices.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/login?mode=signup")}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Free Trial
            </Button>

            <a
              href="#preview"
              className="inline-flex items-center justify-center h-11 px-5 text-sm gap-2.5 rounded-xl font-semibold transition-smooth focus-ring border border-border bg-card text-foreground hover:bg-muted shadow-xs"
            >
              Live Dashboard Preview
            </a>
          </div>

          <p className="text-[11px] text-muted-foreground font-medium pt-2">
            No credit card required · Starter plan from ₹499/month · Production ready
          </p>

          <div className="pt-8 border-t border-border max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">100% Indian Cloud</p>
                <p className="text-[10px] text-muted-foreground">Data residency compliant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <Award className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">ISO 27001 Security</p>
                <p className="text-[10px] text-muted-foreground">256-bit bank encryption</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-warning flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">Auto-Due Tracker</p>
                <p className="text-[10px] text-muted-foreground">Zero missed GST/ITR dates</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <Star className="w-4 h-4 text-warning flex-shrink-0 fill-warning" />
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">4.9 / 5 Rating</p>
                <p className="text-[10px] text-muted-foreground">Over 1,200+ CA firms</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Dashboard Preview Section */}
      <section id="preview" className="py-16 px-6 bg-muted/50 border-b border-border transition-colors">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto animate-fade-in">
            <span className="px-3 py-1 rounded-md bg-primary-muted/60 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
              AUTHENTIC DASHBOARD INTERFACE
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Designed for Speed, Clarity, and Control
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              The unified practice dashboard where your team manages filings, clients, and revenue.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-2 sm:p-4 shadow-elevated overflow-hidden transition-colors animate-zoom-in-95">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border mb-4 bg-muted/60 rounded-t-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
                <span className="text-[11px] font-mono text-muted-foreground ml-2">
                  app.taxflow.com/dashboard
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-semibold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                  ● Live Demo Preview
                </span>
              </div>
            </div>

            <div className="bg-background rounded-xl p-4 sm:p-6 text-foreground space-y-6 border border-border transition-colors">
              <div className="bg-foreground text-background p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Welcome back, Super Admin 👋
                  </h3>
                  <p className="text-xs text-background/70 mt-0.5">
                    Here's what's happening across your CA practice today. All returns, documents, and payments are up to date.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
                    + Add Client
                  </span>
                  <span className="px-3 py-1.5 bg-background/10 text-background border border-background/20 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                    Ask TaxFlow AI
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4 shadow-2xs hover:border-success/40 transition-smooth">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Total Revenue</span>
                    <div className="p-2 bg-success/10 text-success rounded-lg">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-foreground">₹3,85,000</span>
                    <div className="flex items-center text-[10px] text-success font-semibold mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +18.4% vs last month
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4 shadow-2xs hover:border-primary/40 transition-smooth">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Active Clients</span>
                    <div className="p-2 bg-primary-muted text-primary rounded-lg">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-foreground">48</span>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                      Active client accounts
                    </p>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4 shadow-2xs hover:border-warning/40 transition-smooth">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Pending Filings</span>
                    <div className="p-2 bg-warning/10 text-warning rounded-lg">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-foreground">12</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-warning font-semibold">Requires action</span>
                      <span className="text-[10px] text-destructive font-bold">• 2 overdue</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-4 shadow-2xs hover:border-primary/40 transition-smooth">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Total Leads</span>
                    <div className="p-2 bg-primary-muted text-primary rounded-lg">
                      <UserPlus className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-foreground">19</span>
                    <div className="flex items-center text-[10px] text-primary font-semibold mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +6 new this month
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-muted/60 text-primary flex items-center justify-center font-bold">
                    <CheckSquare2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">Live Task Dashboard</span>
                      <span className="text-[10px] bg-primary-muted/60 text-primary font-semibold px-2 py-0.5 rounded-full border border-primary/20">
                        14/16 completed
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Daily priorities & pending actions for your firm
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-64 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>Daily Progress</span>
                    <span className="text-primary font-bold">88%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: "88%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid Section */}
      <section id="features" className="py-20 px-6 bg-card border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-md bg-primary-muted/60 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
              FULL PRACTICE COMPLIANCE
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Engineered for Every CA Practice Workflow
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Replace fragmented spreadsheets and disconnected tools with a unified practice command center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-muted/60 text-primary flex items-center justify-center border border-primary/20">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">GST Returns & Auto-Reconciliation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Streamline GSTR-1, GSTR-3B, and GSTR-9 filings with instant mismatch identification,
                penalty tracker, and period-wise status.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1">
                GSTR-1 · GSTR-3B · GSTR-9
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-muted/60 text-primary flex items-center justify-center border border-primary/20">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">ITR Processing & Tax Computation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Support for ITR-1 to ITR-7, assessment year tracking, tax computation summaries, and
                instant verification status logs.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1">
                ITR-1 through ITR-7 · AY 2024-25 Ready
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-muted/60 text-primary flex items-center justify-center border border-primary/20">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Client CRM & Digital Document Center</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manage active clients and prospective leads with PAN, Aadhaar, GSTIN credentials, and
                encrypted cloud storage for easy audits.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1">
                PAN / Aadhaar / GSTIN Cloud Vault
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-muted/60 text-primary flex items-center justify-center border border-primary/20">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">WhatsApp Hub & Automated Alerts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Send due-date reminders, payment requests, and tax filing confirmations to clients via
                pre-formatted WhatsApp templates with 1-click.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1">
                Instant WhatsApp Web & API Integration
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-muted/60 text-primary flex items-center justify-center border border-primary/20">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Billing, Payments & TDS Ledger</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate professional CA invoices, track outstanding fees, integrate Razorpay links, and
                monitor practice revenue analytics in real-time.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1">
                GST Compliant Invoicing · Razorpay Ready
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-card transition-smooth group space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-muted/60 text-primary flex items-center justify-center border border-primary/20">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">AI Tax Assistant</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ask TaxFlow AI about ITR, GST, TDS/TCS, deadlines, and client compliance — grounded in your practice data with cited sources for current tax info.
              </p>
              <div className="pt-2 text-xs font-semibold text-primary flex items-center gap-1">
                Gemini · RBAC-scoped · Cited sources
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Why TaxFlow Workflow Comparison Section */}
      <section id="workflow" className="py-20 px-6 bg-background border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Transform How Your Firm Operates
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              See the difference between manual spreadsheet chaos and automated practice excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-7 rounded-2xl bg-card border border-destructive/25 shadow-2xs space-y-4 transition-colors">
              <div className="flex items-center space-x-2 text-destructive font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <span>The Traditional Practice</span>
              </div>
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Scattered Excel sheets and lost client password notebooks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Manual phone calls chasing clients for missing bank statements</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Missed GST return dates causing avoidable client penalties</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold">✕</span>
                  <span>Uncollected invoices and unclear outstanding fee tracking</span>
                </li>
              </ul>
            </div>

            <div className="p-7 rounded-2xl bg-card border-2 border-primary shadow-card space-y-4 transition-colors">
              <div className="flex items-center space-x-2 text-primary font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>With TaxFlow Automation</span>
              </div>
              <ul className="space-y-3 text-xs text-foreground/80">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Centralized, encrypted client vault with PAN, GSTIN & KYC records</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Automated WhatsApp reminders sent in 1-click to all pending clients</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Live visual dashboard highlighting upcoming and overdue returns</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Instant payment links via Razorpay with automated fee reconciliation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-card border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-md bg-primary-muted/60 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
              PRICING PLANS
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Simple, Transparent Pricing for Every Firm Size
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Start small, scale as your client base expands. No hidden charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-6 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  STARTER CA PLAN
                </span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-foreground">₹499</span>
                  <span className="text-xs text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Perfect launch plan for individual CAs & boutique practitioners
                </p>
              </div>

              <Button
                onClick={() => navigate("/login?mode=signup")}
                variant="outline"
                className="w-full font-bold text-xs"
              >
                Get Started
              </Button>

              <div className="space-y-2.5 text-xs text-muted-foreground pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Up to 10 clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>1 CA Admin account</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>ITR & GST return tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Document upload & PAN/Aadhaar vault</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>WhatsApp Web reminder links</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>100 AI queries/month</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border-2 border-primary relative space-y-6 shadow-elevated ring-4 ring-primary/10 transition-colors">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                Most Popular
              </span>

              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  GROWTH CA PLAN
                </span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-foreground">₹999</span>
                  <span className="text-xs text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  For growing practices managing multiple clients and team staff
                </p>
              </div>

              <Button onClick={() => navigate("/login?mode=signup")} className="w-full font-bold text-xs">
                Start Free Trial
              </Button>

              <div className="space-y-2.5 text-xs text-foreground/80 pt-3 border-t border-border">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Up to 50 clients</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>1 CA Admin + 1 Staff User</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>500 WhatsApp automated reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Automated Razorpay fee links</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>300 AI queries & OCR document processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Priority email & WhatsApp support</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-6 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  FIRM ENTERPRISE
                </span>
                <div className="flex items-baseline space-x-1 mt-2">
                  <span className="text-4xl font-extrabold text-foreground">₹2,499</span>
                  <span className="text-xs text-muted-foreground">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  For multi-partner firms requiring advanced audit trails & SLA
                </p>
              </div>

              <Button
                onClick={() => navigate("/login?mode=signup")}
                variant="outline"
                className="w-full font-bold text-xs"
              >
                Contact Sales
              </Button>

              <div className="space-y-2.5 text-xs text-muted-foreground pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Unlimited clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Unlimited staff & role permissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Complete audit log & compliance trails</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Custom domain & branded client portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 bg-background border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Trusted by CAs Across India
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              See what fellow Chartered Accountants say about switching to TaxFlow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-4 transition-colors">
              <div className="flex text-warning space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "TaxFlow transformed our practice operations. The WhatsApp reminder hub alone saved our
                team 4 hours a day during July tax rush. Outstanding product."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                  S
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">CA Suresh Gupta</h4>
                  <p className="text-[10px] text-muted-foreground">Gupta & Associates, Mumbai</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-4 transition-colors">
              <div className="flex text-warning space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "The dashboard is crisp, intuitive, and eliminates missed filing deadlines. The GST
                tracking and client document vault give our clients immense peace of mind."
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                  P
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">CA Priya Nambiar</h4>
                  <p className="text-[10px] text-muted-foreground">Nambiar Tax Consultants, Bangalore</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-4 transition-colors">
              <div className="flex text-warning space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "Switching from our old desktop setup was the best decision for our firm. Client billing
                is automated and productivity is up 60%. Highly recommended!"
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">
                  R
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">CA Rohit Agarwal</h4>
                  <p className="text-[10px] text-muted-foreground">Agarwal & Co., New Delhi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Bottom CTA Banner */}
      <section className="py-16 px-6 bg-muted/50 transition-colors">
        <div className="max-w-4xl mx-auto rounded-2xl bg-card text-foreground p-8 md:p-12 text-center space-y-6 shadow-card border border-border">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            TF
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Ready to modernise your CA firm?
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground max-w-xl mx-auto">
            Join thousands of Indian Chartered Accountants streamlining their practice today.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate("/login?mode=signup")}>
              Start Free Trial Now
            </Button>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-border bg-card py-10 px-6 text-xs text-muted-foreground transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
              TF
            </div>
            <span className="text-sm font-bold text-foreground">TaxFlow · Tax & Audit Suite</span>
          </div>

          <p className="text-[11px] text-muted-foreground">
            © 2026 TaxFlow Technologies Pvt Ltd. All rights reserved. GST & Income Tax Portal Compliant.
          </p>

          <div className="flex items-center space-x-6 text-[11px] font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-smooth">
              Features
            </a>
            <a href="#pricing" className="hover:text-primary transition-smooth">
              Pricing
            </a>
            <button
              onClick={() => navigate("/login?mode=login")}
              className="hover:text-primary transition-smooth"
            >
              Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
