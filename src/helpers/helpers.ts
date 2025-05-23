import type { GUID } from "../defines/types";

export function generateGuid() : GUID {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) as GUID;
}

export function getOrCreateClientId() : GUID {
	const key = "pong-client-id";
	let clientId = sessionStorage.getItem(key);

	if (!clientId) {
		clientId = generateGuid();
		sessionStorage.setItem(key, clientId);
	}
	return clientId as GUID;
}
