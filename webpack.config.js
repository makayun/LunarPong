require('ts-node').register();

module.exports = [
	require("./webpack.back.ts").default,
	require("./webpack.front.ts").default
];
