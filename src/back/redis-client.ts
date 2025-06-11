import { createClient } from 'redis';

let redis: ReturnType<typeof createClient> | null = null;

export async function initRedis(): Promise<void> {
	const client = createClient({
		url: 'redis://redis:6379',
	});

	client.on('error', (err) => console.error('[Redis] Client Error', err));

	await client.connect();
	redis = client;
}

export function getRedis(): ReturnType<typeof createClient> {
	if (!redis) {
		throw new Error('Redis not initialized. Call initRedis() first.');
	}
	return redis;
}
