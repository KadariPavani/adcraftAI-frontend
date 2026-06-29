import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalTracking } from "@/lib/analytics";

installGlobalTracking();

createRoot(document.getElementById("root")!).render(<App />);
