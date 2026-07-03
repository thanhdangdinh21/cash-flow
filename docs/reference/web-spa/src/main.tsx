import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";

import "./styles/fonts.css";
import "./styles/colors.css";
import "./styles/typography.css";
import "./styles/spacing.css";
import "./styles/radii.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
