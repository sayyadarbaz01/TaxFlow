import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { AppRouter } from "./app/router";
import { AuthUser } from "@ca-saas/shared-types";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

const AppInit = () => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedToken = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("authUser");
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          return parsed;
        }
      } catch (e) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authUser");
      }
    }
    return null;
  });

  const handleLoginSuccess = (authUser: AuthUser, token: string) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("authUser", JSON.stringify(authUser));
    setUser(authUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <AppRouter user={user} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
    </BrowserRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <AppInit />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
