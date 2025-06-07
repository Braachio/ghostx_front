module.exports = {
  darkMode: 'media', // 또는 'class' 사용 가능
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        light: {
          background: '#ffffff',
          card: '#f9f9f9',
          text: '#000000',
        },
        dark: {
          background: '#1a1a1a',
          card: '#2a2a2a',
          text: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};