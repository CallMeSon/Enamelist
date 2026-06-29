/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        "pastel-pink": "#FF1F4B",
        "pastel-pink-dark": "#D90429",
        "pastel-blue": "#0079A1",
        "pastel-blue-dark": "#005F73",
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

