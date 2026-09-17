import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Registers listeners only; must run before the first lazy route is imported.
import "./lib/chunkReload";

createRoot(document.getElementById("root")!).render(<App />);
