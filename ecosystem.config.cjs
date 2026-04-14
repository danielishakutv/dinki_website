module.exports = {
  apps: [
    {
      name: 'dinki-frontend',
      script: 'npx',
      args: 'vite preview --host 0.0.0.0 --port 4173',
      cwd: '/home/dinki/public_html',
      env: {
        NODE_ENV: 'production',
        VITE_API_URL: 'https://be.dinki.africa/v1',
      },
    },
  ],
};
