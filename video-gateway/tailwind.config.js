/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Scan all Handlebars files in the 'src/views' directory
    "./src/views/**/*.hbs",
    // If there are any inline JS that adds classes, or other HTML files in 'public'
    "./public/**/*.html", // Include if plan to have static HTM files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}