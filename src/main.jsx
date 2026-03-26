import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CableMapper from "./CableMapper";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CableMapper />
  </StrictMode>
);