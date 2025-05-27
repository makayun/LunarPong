import type { GUID } from "../defines/types";

const adjectives = ["Quick", "Bright", "Calm", "Sharp", "Warm"];
const nouns = ["Book", "Star", "Tree", "Cloud", "Key"];

export function generateGuid(): GUID {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	) as GUID;
}

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

export function getOrCreateNickname(): string {
	const key = "pong-nickname";
	let nickname = sessionStorage.getItem(key);

	if (!nickname) {
		nickname = generateNickname();
		sessionStorage.setItem(key, nickname);
	}
	return nickname;
}



// import type { GUID } from "../defines/types";

// export function generateGuid() : GUID {
//     return Math.random().toString(36).substring(2, 15) +
//         Math.random().toString(36).substring(2, 15) as GUID;
// }

// export function getOrCreateClientId() : GUID {
// 	const key = "pong-client-id";
// 	let clientId = sessionStorage.getItem(key);

// 	if (!clientId) {
// 		clientId = generateGuid();
// 		sessionStorage.setItem(key, clientId);
// 	}
// 	return clientId as GUID;
// }
