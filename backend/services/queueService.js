const celery = require('celery-node');

const client = celery.createClient(
  process.env.CELERY_BROKER_URL || 'redis://localhost:6379/0',
  process.env.CELERY_RESULT_BACKEND || 'redis://localhost:6379/0'
);

module.exports = client;
