module.exports = {
    apps: [
      {
        name: 'api-0',
        script: 'npm run dev',
        autorestart: true,
        watch: false,
        env: { PORT: 9003 },
      },
      {
        name: 'api-1',
        script: 'npm run dev',
        autorestart: true,
        watch: false,
        env: { PORT: 9004 },
      },
      {
        name: 'api-2',
        script: 'npm run dev',
        autorestart: true,
        watch: false,
        env: { PORT: 9005 },
      }
    ],
  };