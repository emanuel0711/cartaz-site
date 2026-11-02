import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./features/auth/AuthProvider";
import "./styles/index.css";
import "@fontsource/anton/latin-ext-400.css";
import { activateStoredImpact } from "./lib/impactFont";

void activateStoredImpact();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);
