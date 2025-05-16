import fs					from "fs";
import path					from "path";
import { ProgressPlugin }	from "webpack";
import HtmlWebpackPlugin	from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import webpack			from "webpack";

import { assetLoader, scssLoader, tsLoader }	from "./webpack.buildHelpers"
import type { BuildMode, BuildPaths }			from "./webpack.buildHelpers";

const appDir = fs.realpathSync(process.cwd());
const srcDir = "src";
const frontDir = "front";
const pubDir = "public";

export default (env: { mode: BuildMode }) => {
	const isDev: boolean = env.mode === "development";

	const appPaths: BuildPaths = {
		entry: path.resolve(appDir, srcDir, frontDir, "game.ts"),
		output: path.resolve(appDir, frontDir),
		public: path.resolve(appDir, pubDir),
		html: path.resolve(appDir, pubDir, "index.html"),
		favicon: path.resolve(appDir, pubDir, "favicon.ico")
	}

	const config: webpack.Configuration = {
		mode: env.mode ?? "development",
		entry: appPaths.entry,
		output: {
			path: appPaths.output,
			filename: "js/[name].[contenthash].js",
			clean: true
		},
		devtool: isDev ? "inline-source-map" : false,
		resolve: { extensions: [ ".tsx", ".ts", ".js"] },
		module: { rules: [ scssLoader(isDev), tsLoader, assetLoader ] },
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
				const game = assets.js.filter(file => file.includes("main"))
					.map(file => `<script src="${file}"></script>`)
					.join('\n');
				return { game };
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

