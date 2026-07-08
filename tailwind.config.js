/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs',
    './public/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:        '#05070D',
          card:      '#0B0F1A',
          elevated:  '#11172A',
          border:    '#1C2236',
          primary:   '#2546F0',
          cyan:      '#22D3EE',
          blue:      '#3B5BFF',
          text:      '#F4F6FB',
          muted:     '#9AA4B8',
          tertiary:  '#5C6678',
        },
      },
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2546F0 0%, #22D3EE 100%)',
        'brand-gradient-r': 'linear-gradient(90deg, #2546F0 0%, #22D3EE 100%)',
      },
      boxShadow: {
        'glow-cyan':  '0 0 20px rgba(34,211,238,0.25)',
        'glow-blue':  '0 0 20px rgba(37,70,240,0.35)',
        'glow-card':  '0 4px 32px rgba(0,0,0,0.5)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.brand.text'),
            lineHeight: '1.75',
            a: { color: theme('colors.brand.cyan'), textDecoration: 'none' },
            h1: { color: theme('colors.brand.text'), fontFamily: 'Sora, sans-serif', fontWeight: '700' },
            h2: { color: theme('colors.brand.text'), fontFamily: 'Sora, sans-serif', fontWeight: '700' },
            h3: { color: theme('colors.brand.text'), fontFamily: 'Sora, sans-serif', fontWeight: '600' },
            strong: { color: theme('colors.brand.text') },
            blockquote: {
              borderLeftColor: theme('colors.brand.cyan'),
              color: theme('colors.brand.muted'),
              fontStyle: 'italic',
            },
            code: {
              color: theme('colors.brand.cyan'),
              backgroundColor: theme('colors.brand.elevated'),
              borderRadius: '4px',
              padding: '2px 6px',
            },
            'code::before': { content: '""' },
            'code::after': { content: '""' },
          },
        },
      }),
    },
  },
  plugins: [],
}
