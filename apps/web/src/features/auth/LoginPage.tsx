import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLoginMutation, useSignupMutation } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
  initialMode?: "login" | "signup";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldInputClass =
  "w-full h-9 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground transition-smooth focus-ring focus-visible:border-primary/40";

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, initialMode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const modeParam = searchParams.get("mode");
  const initialIsSignup = initialMode === "signup" || modeParam === "signup";
  const [isSignUp, setIsSignUp] = useState<boolean>(initialIsSignup);

  // Login state (clean by default)
  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup state (CA Firm Name removed completely)
  const [name, setName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [isDuplicateEmailError, setIsDuplicateEmailError] = useState(false);
  const [successMsg, setSuccessMsg] = useState(() => {
    return searchParams.get("registered") === "true"
      ? "Account created successfully! Please enter your password to log in."
      : "";
  });

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();

  useEffect(() => {
    if (initialMode === "signup" || modeParam === "signup") {
      setIsSignUp(true);
    } else if (modeParam === "login") {
      setIsSignUp(false);
    }
  }, [modeParam, initialMode]);

  const toggleMode = (signupMode: boolean) => {
    setIsSignUp(signupMode);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("mode", signupMode ? "signup" : "login");
      return next;
    });
    setErrorMsg("");
    setIsDuplicateEmailError(false);
    setSuccessMsg("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsDuplicateEmailError(false);
    setSuccessMsg("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address (e.g. name@domain.com).");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    try {
      const res = await login({ email: trimmedEmail, password }).unwrap();
      localStorage.setItem("accessToken", res.accessToken);
      onLoginSuccess(res.user, res.accessToken);

      // Redirect to target path or dashboard
      const redirectPath = searchParams.get("redirect") || "/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      const message =
        err.data?.error?.message ||
        err.data?.message ||
        "Invalid email or password. Please try again.";
      setErrorMsg(message);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsDuplicateEmailError(false);
    setSuccessMsg("");

    const trimmedName = name.trim();
    const trimmedEmail = signupEmail.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg("Please enter your full name (minimum 2 characters).");
      return;
    }
    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      await signup({
        name: trimmedName,
        email: trimmedEmail,
        password: signupPassword,
      }).unwrap();

      // Clear signup sensitive inputs
      setSignupPassword("");
      setConfirmPassword("");

      // Automatically redirect to Login tab with email prefilled
      setEmail(trimmedEmail);
      setPassword("");
      setIsSignUp(false);
      setSearchParams({ mode: "login", email: trimmedEmail, registered: "true" });
      setSuccessMsg("Account created successfully! Please enter your password to log in.");
    } catch (err: any) {
      const msg =
        err.data?.error?.message ||
        err.data?.message ||
        "Sign up failed. Please try again.";

      if (msg.toLowerCase().includes("already exists") || err.status === 409) {
        setErrorMsg("An account with this email already exists.");
        setIsDuplicateEmailError(true);
      } else {
        setErrorMsg(msg);
      }
    }
  };

  const tabInactiveClass =
    "text-muted-foreground hover:text-foreground transition-smooth";
  const tabActiveClass = "bg-primary text-primary-foreground shadow-xs";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-foreground">
      {/* Top Header Bar */}
      <header className="max-w-7xl w-full mx-auto px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-smooth focus-ring rounded-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {/* Brand Logo Header & Theme Toggle */}
        <div className="flex items-center gap-4">
          <ThemeToggle size="sm" />
          <button
            type="button"
            className="flex items-center gap-3 text-left group focus-ring rounded-lg"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-xs group-hover:bg-primary/90 transition-smooth">
              TF
            </div>
            <div>
              <span className="text-sm font-bold text-foreground tracking-tight leading-none block">
                TaxFlow
              </span>
              <span className="text-2xs text-muted-foreground font-medium block mt-0.5">
                Practice OS
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center px-4 py-6">
        <div className="surface-card shadow-elevated p-6 sm:p-8 space-y-6">
          {/* Segmented Mode Switcher Tabs */}
          <div className="flex p-1 bg-muted rounded-xl text-xs font-bold" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignUp}
              id="login-tab-btn"
              onClick={() => toggleMode(false)}
              className={`flex-1 py-2 rounded-lg text-center ${!isSignUp ? tabActiveClass : tabInactiveClass}`}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignUp}
              id="signup-tab-btn"
              onClick={() => toggleMode(true)}
              className={`flex-1 py-2 rounded-lg text-center ${isSignUp ? tabActiveClass : tabInactiveClass}`}
            >
              Sign Up
            </button>
          </div>

          {/* Card Header Titles */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {isSignUp ? "Create Your Account" : "Welcome Back"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isSignUp
                ? "Enter your details to register and get started"
                : "Enter your credentials to access your firm dashboard"}
            </p>
          </div>

          {/* Error Alert Banner */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-medium space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              {isDuplicateEmailError && (
                <button
                  type="button"
                  onClick={() => {
                    setEmail(signupEmail.trim());
                    toggleMode(false);
                  }}
                  className="text-[11px] text-primary hover:text-primary/80 font-bold underline block pl-6 transition-smooth"
                >
                  Click here to Login with this email →
                </button>
              )}
            </div>
          )}

          {/* Success Alert Banner */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {!isSignUp ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="login-email-input"
                  className="block text-xs font-semibold text-foreground/80"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="login-email-input"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@taxflow.com"
                    className={`${fieldInputClass} pl-9 pr-3`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="login-password-input"
                  className="block text-xs font-semibold text-foreground/80"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    id="login-password-input"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${fieldInputClass} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition-smooth focus-ring rounded"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                id="login-submit-btn"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 text-xs rounded-lg shadow-xs"
                isLoading={isLoginLoading}
              >
                Login
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode(true)}
                  className="text-primary hover:text-primary/80 font-semibold underline ml-1 transition-smooth"
                >
                  Sign Up
                </button>
              </p>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="signup-name-input"
                  className="block text-xs font-semibold text-foreground/80"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    id="signup-name-input"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="CA Rajesh Sharma"
                    className={`${fieldInputClass} pl-9 pr-3`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-email-input"
                  className="block text-xs font-semibold text-foreground/80"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    id="signup-email-input"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="rajesh@taxfirm.in"
                    className={`${fieldInputClass} pl-9 pr-3`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-password-input"
                  className="block text-xs font-semibold text-foreground/80"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    id="signup-password-input"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className={`${fieldInputClass} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition-smooth focus-ring rounded"
                    aria-label={showSignupPassword ? "Hide password" : "Show password"}
                  >
                    {showSignupPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="signup-confirm-password-input"
                  className="block text-xs font-semibold text-foreground/80"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="signup-confirm-password-input"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className={`${fieldInputClass} pl-9 pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition-smooth focus-ring rounded"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                id="signup-submit-btn"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 text-xs rounded-lg shadow-xs"
                isLoading={isSignupLoading}
              >
                Sign Up
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => toggleMode(false)}
                  className="text-primary hover:text-primary/80 font-semibold underline ml-1 transition-smooth"
                >
                  Login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="px-4 py-6 text-center text-xs text-muted-foreground border-t border-border bg-background">
        © 2026 TaxFlow · Practice OS. Protected by 256-bit encryption.
      </footer>
    </div>
  );
};
