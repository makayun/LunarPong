import fs					from "node:fs";
import path					from "node:path";
import { ProgressPlugin }	from "webpack";
import type webpack			from "webpack";

import { tsLoader }						from "./webpack.buildHelpers";
import type { BuildMode, BuildPaths }	from "./webpack.buildHelpers"

const nodeExternals = require('webpack-node-externals');

const appDir = fs.realpathSync(process.cwd());
const srcDir = "src";
const backDir = "back";

export default (env: { mode: BuildMode }) => {
	const isDev: boolean = env.mode === "development";

	const appPaths: BuildPaths = {
		entry: { server: path.resolve(appDir, srcDir, backDir, "server.ts") },
		output: path.resolve(appDir, backDir)
	}

	const config: webpack.Configuration = {
		mode: env.mode ?? "development",
		entry: appPaths.entry,
		output: { path: appPaths.output, clean: true },
		externalsPresets: { node: true },
		devtool: isDev ? "inline-source-map" : false,
		resolve: { extensions: [ ".tsx", ".ts", ".js"] },
		module: { rules: [ tsLoader ] },
		plugins: [ isDev && new ProgressPlugin() ],
		externals: [ nodeExternals() ]
	};

	return config;
}

