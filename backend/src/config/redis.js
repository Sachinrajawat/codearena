const { createClient } = require('redis');

let wasReady = false;

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_HOST || 'sugar-jasper-tender-43550.db.redis.io',
        port: Number(process.env.REDIS_PORT) || 19017,
        // Before the first successful connection, give up after 5 attempts so
        // startup fails fast. After that, keep retrying forever with a short backoff.
        reconnectStrategy: (retries) => {
            if (!wasReady && retries >= 5) {
                return new Error('Could not connect to Redis at startup');
            }
            return Math.min(retries * 200, 3000);
        }
    }
});

// Without an 'error' listener, a dropped connection can crash the whole process
redisClient.on('error', (err) => {
    console.error('Redis error:', err.message);
});

redisClient.on('ready', () => {
    wasReady = true;
    console.log('Redis ready');
});

redisClient.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

module.exports = redisClient;