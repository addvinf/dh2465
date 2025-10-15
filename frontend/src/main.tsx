import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Load development tools
if (import.meta.env.DEV) {
  import("./utils/devTools");
}

createRoot(document.getElementById("root")!).render(<App />);
