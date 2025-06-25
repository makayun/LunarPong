import type { GUID, User_f } from "../defines/types";

const adjectives = [ "Quick", "Bright", "Calm", "Sharp", "Mighty", "Lazy", "Sad", "Angry" ];
const nouns = ["Cat", "Star", "Tree", "Cloud", "Bird", "Snail", "Thor", "Hulk", "Groot", "Loki"];

export function generateGuid(): GUID {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	) as GUID;
}

// proverka na unikalnost!!! 🔥
export function generateNickname(): string {
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
	const token = sessionStorage.getItem("accessToken");

	if (!token) {
		const errMsg = "No such client!";
		alert(errMsg);
		throw new Error(errMsg);
	}
	return token;
}

export function getUserId(timeoutMs = 5 * 60000): Promise<GUID> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const check = () => {
			const userId = sessionStorage.getItem("pong-client-id");
			if (userId && userId !== "-1") {
				resolve(userId as GUID);
			} else if (Date.now() - start > timeoutMs) {
				alert("The login takes too long, try to reload the page");
				reject(new Error("Timed out waiting for user ID"));
			} else {
				setTimeout(check, 500);
			}
		};
		check();
	});
}

export function getUserNickname(timeoutMs = 5 * 60000): Promise<string> {
	return new Promise((resolve, reject) => {
		const start = Date.now();
		const check = () => {
			const userNick = sessionStorage.getItem("pong-nickname");
			if (userNick) {
				resolve(userNick);
			} else if (Date.now() - start > timeoutMs) {
				alert("The login takes too long, try to reload the page");
				reject(new Error("Timed out waiting for user nickname"));
			} else {
				setTimeout(check, 500);
			}
		};
		check();
	});
}

export function setUser(user: User_f) {
	sessionStorage.setItem("pong-client-id", user.id.toString());
	sessionStorage.setItem("pong-nickname", user.name ? user.name : generateNickname())
}

export function unsetUser() {
	sessionStorage.removeItem("pong-client-id");
	sessionStorage.removeItem("pong-nickname");
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
