import fs					from "node:fs";
import path					from "node:path";
import { ProgressPlugin }	from "webpack";
import HtmlWebpackPlugin	from "html-webpack-plugin";
import CopyPlugin           from 'copy-webpack-plugin';
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import type webpack			from "webpack";

import { assetLoader, cssLoader, tsLoader }	from "./webpack.buildHelpers"
import type { BuildMode, BuildPaths }			from "./webpack.buildHelpers";

const appDir = fs.realpathSync(process.cwd());
const srcDir = "src";
const frontDir = "front";
const pubDir = "public";
const localesDir = "locales";

export default (env: { mode: BuildMode }) => {
	const isDev: boolean = env.mode === "development";

	const appPaths: BuildPaths = {
		entry: {
			"i18next": path.resolve(appDir, srcDir, frontDir, "i18next.ts"),
			"login": path.resolve(appDir, srcDir, frontDir, "login.ts"),
			"game": path.resolve(appDir, srcDir, frontDir, "game.ts"),
			"chat": path.resolve(appDir, srcDir, frontDir, "chat.ts")
		},
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
			chunkFilename: "js/[name].[contenthash].js",
			clean: true
		},
		devtool: isDev ? "inline-source-map" : false,
		resolve: { extensions: [ ".tsx", ".ts", ".js"] },
		module: { rules: [ cssLoader, tsLoader, assetLoader ] },
		plugins: buildFrontPlugins(appPaths, isDev)
	};

	return config;
}


export function buildFrontPlugins(paths: BuildPaths, isDev: boolean) : webpack.Configuration["plugins"] {
	const plugins : webpack.Configuration["plugins"] = [
		new HtmlWebpackPlugin({
			template: paths.html,
			favicon: paths.favicon,
			inject: true
		})
	];

	if (isDev) {
		plugins.push(new ProgressPlugin());
		plugins.push(new MiniCssExtractPlugin({
			filename: "css/[name].[contenthash:8].css",
			chunkFilename: "css/[name].[contenthash:8].css"
		}))
	}

	else {
		plugins.push(new MiniCssExtractPlugin({
			filename: "css/[name].[contenthash:8].css",
			chunkFilename: "css/[name].[contenthash:8].css"
		}))
	}

	return plugins;
}

