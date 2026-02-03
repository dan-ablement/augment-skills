/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Skill proficiency levels
        'skill-expert': '#22c55e',      // Green - 90-100
        'skill-proficient': '#84cc16',  // Lime - 70-89
        'skill-developing': '#eab308',  // Yellow - 50-69
        'skill-beginner': '#f97316',    // Orange - 25-49
        'skill-none': '#ef4444',        // Red - 0-24
        'skill-empty': '#e5e7eb',       // Gray - No data
      },
    },
  },
  plugins: [],
};

