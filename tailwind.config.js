/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {},
  },
  safelist: [
    "bg-red-900/50",
    "border-red-400/50",
    "bg-red-900/20",
    "border-red-400/20",
    "text-red-400",
    "bg-green-900/50",
    "border-green-400/50",
    "bg-green-900/20",
    "border-green-400/20",
    "text-green-400",
    "bg-blue-900/50",
    "border-blue-400/50",
    "bg-blue-900/20",
    "border-blue-400/20",
    "text-blue-400",
    "bg-red",
    "bg-green",
    "bg-blue",
    "border-red",
    "border-green",
    "border-blue",
    "border-red-500",
    "border-green-500",
    "border-blue-500",
    "bg-gradient-to-br",
    "from-red-500",
    "to-black",
    "from-green-500",
    "to-black",
    "from-blue-500",
    "to-black",
    "bg-red-900",
    "bg-green-900",
    "bg-blue-900",
    "text-red-100",
    "text-green-100",
    "text-blue-100",
    "border-red-700",
    "border-green-700",
    "border-blue-700",
    "bg-red-900/50",
    "bg-green-900/50",
    "bg-blue-900/50", // Opacity variations
    "border-red-400/50",
    "border-green-400/50",
    "border-blue-400/50",
    "hover:bg-red-800",
    "hover:bg-green-800",
    "hover:bg-blue-800",
    "focus:border-red-500",
    "focus:border-green-500",
    "focus:border-blue-500",
    "bg-red-600",
    "bg-green-600",
    "bg-blue-600",
    "hover:bg-red-700",
    "hover:bg-green-700",
    "hover:bg-blue-700",
    "hover:bg-red-200",
    "hover:bg-green-200",
    "hover:bg-blue-200",
    "hover:border-red-900",
    "hover:border-green-900",
    "hover:border-blue-900",
    "focus:ring-red-500",
    "focus:ring-green-500",
    "focus:ring-blue-500",
    { pattern: /^bg-(red|green|blue)-(900|800|700)\/[0-9]+$/ },
    { pattern: /^hover:bg-(red|green|blue)-(800|700)\/[0-9]+$/ },
    {
      pattern: /(hover:)?border-(red|blue|green)-[0-9]+/, // Match border and hover:border classes
    },
    {
      pattern: /(hover:)?shadow-(red|blue|green)-[0-9]+/, // Match shadow classes
    },

    // For text and border colors
    { pattern: /^text-(red|green|blue)$/ },
    { pattern: /^border-(red|green|blue)\/[0-9]+$/ },
    { pattern: /^hover:border-(red|green|blue)\/[0-9]+$/ },

    // For shadow glow effects
    { pattern: /^shadow-(red|green|blue)\/[0-9]+$/ },
  ],
  plugins: [],
  variants: {
    extend: {
      borderColor: ["hover"],
    },
  },
};
