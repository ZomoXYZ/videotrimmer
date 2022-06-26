import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";

const rootDOM = document.getElementById("main");
if (!rootDOM) throw new Error("No root DOM element found");
const root = createRoot(rootDOM);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
