import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Link to Font Awesome for icons
const fontAwesomeScript = document.createElement('script');
fontAwesomeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js";
fontAwesomeScript.crossOrigin = "anonymous";
document.head.appendChild(fontAwesomeScript);

// Link to Google Fonts for Montserrat and Open Sans
const googleFontsLink = document.createElement('link');
googleFontsLink.rel = "stylesheet";
googleFontsLink.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Open+Sans:wght@400;500;600&display=swap";
document.head.appendChild(googleFontsLink);

createRoot(document.getElementById("root")!).render(<App />);
