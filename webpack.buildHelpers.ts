import type { RuleSetRule } from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

export type BuildMode = "production" | "development";

export type BuildPaths = {
	entry:		Record<string, string>,
	output:		string,
	public?:	string,
	html?:		string,
	favicon?:	string
};

export type BuildOptions = {
	mode:	BuildMode,
	paths:	BuildPaths
}

export const tsLoader: RuleSetRule = {
	test: /\.tsx?$/,
	use: "ts-loader",
	exclude: [ /node_modules/ ]
}

export const assetLoader: RuleSetRule = {
	test: /\.(png|jpe?g|gif|svg|ttf|woff2?|eot)$/,
	type: 'asset/resource',
	generator: {
		filename: 'assets/[name][ext]',
	},
}

export const cssLoader = {
  test: /\.css$/,
  use: [
    MiniCssExtractPlugin.loader,
    'css-loader'
  ]
};

export function scssLoader(isDev: boolean) : RuleSetRule {
	const scssRule: RuleSetRule = {
		test:  /\.s[ac]ss$/i,
		use: [
			isDev ? "style-loader" : MiniCssExtractPlugin.loader,
			"css-loader",
			"sass-loader",
		]
	};
	return scssRule;
}
