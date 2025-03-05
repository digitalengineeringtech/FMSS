module.exports = {
    apps: [
      {
        name: 'api-1',
        script: 'npm run dev',
        autorestart: true,
        max_memory_restart: '1G',
        watch: false,
        env: { PORT: 9002 },
      },
      {
        name: 'api-2',
        script: 'npm run dev',
        autorestart: true,
        max_memory_restart: '1G',
        watch: false,
        env: { PORT: 9003 },
      },
      {
        name: 'api-3',
        script: 'npm run dev',
        autorestart: true,
        max_memory_restart: '1G',
        watch: false,
        env: { PORT: 9004 },
      },
      {
        name: 'api-4',
        script: 'npm run dev',
        autorestart: true,
        max_memory_restart: '1G',
        watch: false,
        env: { PORT: 9005 },
      }
    ],
  };