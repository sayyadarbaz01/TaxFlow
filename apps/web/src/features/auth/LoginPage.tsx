import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLoginMutation, useSignupMutation } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Building2, User, Lock, Mail } from "lucide-react";

export interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const modeParam = searchParams.get("mode");
  const [isSignUp, setIsSignUp] = useState<boolean>(modeParam === "signup");

  // Login state
  const [email, setEmail] = useState("superadmin@taxflow.com");
  const [password, setPassword] = useState("Password123!");

  // Signup state
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firmName, setFirmName] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();

  useEffect(() => {
    setIsSignUp(modeParam === "signup");
    setErrorMsg("");
    setSuccessMsg("");
  }, [modeParam]);

  const toggleMode = (signupMode: boolean) => {
    setIsSignUp(signupMode);
    setSearchParams({ mode: signupMode ? "signup" : "login" });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await login({ email, password }).unwrap();
      localStorage.setItem("accessToken", res.accessToken);
      onLoginSuccess(res.user, res.accessToken);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.data?.error?.message || "Login failed. Please check your email and password.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (signupPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await signup({
        name,
        email: signupEmail,
        password: signupPassword,
        firmName: firmName || undefined
      }).unwrap();

      localStorage.setItem("accessToken", res.accessToken);
      setSuccessMsg("Account created successfully! Redirecting to dashboard...");
      
      setTimeout(() => {
        onLoginSuccess(res.user, res.accessToken);
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.data?.error?.message || "Sign up failed. User email may already be registered.");
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-violet-600 selection:text-white">
      {/* Top Bar */}
      <div className="max-w-7xl w-full mx-auto p-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>

        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-base flex items-center justify-center shadow-lg shadow-violet-900/30">
            T
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">TaxFlow <span className="text-violet-400 font-normal">AI</span></span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-8 px-4">
        <div className="bg-[#0f172a] rounded-3xl p-8 border border-slate-800/80 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={`flex-1 py-2.5 rounded-lg text-center transition-smooth ${
                !isSignUp
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={`flex-1 py-2.5 rounded-lg text-center transition-smooth ${
                isSignUp
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Start Free Trial
            </button>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {isSignUp ? "Create Your CA Account" : "Welcome Back"}
            </h2>
            <p className="text-xs text-slate-400">
              {isSignUp
                ? "Start your 14-day free trial · No credit card required"
                : "Enter your credentials to access your firm dashboard"}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-300 rounded-xl text-xs font-medium flex items-start space-x-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded-xl text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {!isSignUp ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@firm.com"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-smooth"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-smooth"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 text-xs rounded-xl shadow-lg shadow-violet-900/40 border-0"
                isLoading={isLoginLoading}
              >
                Sign In with Email
              </Button>

              <p className="text-center text-xs text-slate-400 pt-2">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode(true)}
                  className="text-violet-400 hover:text-violet-300 font-bold underline"
                >
                  Start Free Trial
                </button>
              </p>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="CA Rajesh Kumar"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-smooth"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CA Firm Name (Optional)</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="Kumar & Associates CA"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-smooth"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="rajesh@kumarassociates.com"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-smooth"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-smooth"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-smooth"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3 text-xs rounded-xl shadow-lg shadow-violet-900/40 border-0"
                isLoading={isSignupLoading}
              >
                Create Account & Access Dashboard
              </Button>

              <div className="pt-2 text-center text-xs text-slate-400 space-y-1">
                <p>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode(false)}
                    className="text-violet-400 hover:text-violet-300 font-bold underline"
                  >
                    Sign In
                  </button>
                </p>
                <div className="flex items-center justify-center space-x-1 text-[11px] text-slate-500 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-bit SSL encrypted · Bank grade security</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-[11px] text-slate-500 border-t border-slate-800/60 bg-[#060911]">
        © 2026 TaxFlow AI Technologies Pvt Ltd. All rights reserved.
      </div>
    </div>
  );
};
