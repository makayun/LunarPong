import fs					from "node:fs";
import path					from "node:path";
import { ProgressPlugin }	from "webpack";
import HtmlWebpackPlugin	from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import type webpack			from "webpack";

import { assetLoader, cssLoader, scssLoader, tsLoader }	from "./webpack.buildHelpers"
import type { BuildMode, BuildPaths }			from "./webpack.buildHelpers";

const appDir = fs.realpathSync(process.cwd());
const srcDir = "src";
const frontDir = "front";
const pubDir = "public";

export default (env: { mode: BuildMode }) => {
	const isDev: boolean = env.mode === "development";

	const appPaths: BuildPaths = {
		entry: {
			"game": path.resolve(appDir, srcDir, frontDir, "game.ts"),
			"chat": path.resolve(appDir, srcDir, frontDir, "chat.ts")
		},
		output: path.resolve(appDir, frontDir),
		public: path.resolve(appDir, pubDir),
		html: path.resolve(appDir, pubDir, "index.html"),
		css: path.resolve(appDir, pubDir, "index.css"),
		favicon: path.resolve(appDir, pubDir, "favicon.ico")
	}

	const config: webpack.Configuration = {
		mode: env.mode ?? "development",
		entry:
		{
			...appPaths.entry,
		},
		output: {
			path: appPaths.output,
			filename: "js/[name].[contenthash].js",
			chunkFilename: "js/[name].[contenthash].js",
			clean: true
		},
		devtool: isDev ? "inline-source-map" : false,
		resolve: { extensions: [ ".tsx", ".ts", ".js"] },
		module: { rules: [ scssLoader(isDev), tsLoader, assetLoader, cssLoader ] },
		plugins: buildFrontPlugins(appPaths, isDev)
	};

	return config;
}


export function buildFrontPlugins(paths: BuildPaths, isDev: boolean) : webpack.Configuration["plugins"] {
	const plugins : webpack.Configuration["plugins"] = [
		new HtmlWebpackPlugin({
			template: paths.html,
			favicon: paths.favicon,
			inject: false,
			templateParameters(compilation, assets) {
				if (compilation.errors)
					console.log(compilation.errors);
				function buildScript(scriptName: string) : string {
					const script: string = assets.js.filter(file => file.includes(scriptName))
						.map(file => `<script src="${file}"></script>`)
						.join('\n');
					if (!script)
						console.error(`\x1b[31m[ERROR]\x1b[0m Maybe your ${scriptName} file has the wrong name!`);

					return (script);
				}
				const game: string = buildScript("game");
				const chat: string = buildScript("chat");

				return { game, chat };
			},
		})
	];

	if (isDev) {
		plugins.push(new ProgressPlugin());
	}

	else {
		plugins.push(new MiniCssExtractPlugin({
			filename: "css/[name].[contenthash:8].css",
			chunkFilename: "css/[name].[contenthash:8].css"
		}))
	}

	return plugins;
}

