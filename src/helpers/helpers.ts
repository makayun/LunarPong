import type { GUID } from "../defines/types";

const adjectives = [ "Quick", "Bright", "Calm", "Sharp", "Mighty", "Lazy", "Sad", "Angry" ];
const nouns = ["Cat", "Star", "Tree", "Cloud", "Bird", "Snail", "Thor", "Hulk", "Groot", "Loki"];

export function generateGuid(): GUID {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	) as GUID;
}

// proverka na unikalnost!!! 🔥
function generateNickname(): string {
	const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
	const noun = nouns[Math.floor(Math.random() * nouns.length)];
	return `${adj}${noun}`;
}

export function getOrCreateClientId(): GUID {
	const key = "pong-client-id";
	let clientId = sessionStorage.getItem(key);

	if (!clientId) {
		clientId = generateGuid();
		sessionStorage.setItem(key, clientId);
	}
	return clientId as GUID;
}

export function getAccessToken() : string {
	const token = localStorage.getItem("accessToken");

	if (!token) {
		const errMsg = "No such client!";
		alert(errMsg);
		throw new Error(errMsg);
	}
	return token;
}

export function getOrCreateNickname(): string {
	const key = "pong-nickname";
	let nickname = sessionStorage.getItem(key);

	if (!nickname) {
		nickname = generateNickname();
		sessionStorage.setItem(key, nickname);
	}
	return nickname;
}
