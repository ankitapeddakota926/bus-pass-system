// Dynamically use the current hostname so it works on both PC (localhost) and mobile (network IP)
const API_BASE = import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname}:5000`;

export default API_BASE;
