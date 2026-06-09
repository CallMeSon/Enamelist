/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        "pastel-pink": "#FF4D6D",
        "pastel-pink-dark": "#E01E37",
        "pastel-blue": "#4CC9F0",
        "pastel-blue-dark": "#4361EE",
        "pastel-yellow": "#FFD60A",
        "pastel-green": "#38B000",
        "pastel-purple": "#7209B7",
        "off-white": "#F8F9FA",
        "dark-bg": "#0F172A",
        "dark-card": "#1E293B",
        "whatsapp": "#15803D"
      }
    }
  }
};

