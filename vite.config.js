import { defineConfig } from 'vite'
import image from '@rollup/plugin-image'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
  plugins: [
      image(),
      createHtmlPlugin({
      entry: 'index.html',
      template: 'public/index.html',
      inject: {
        data: {
          title: 'index',
          injectScript: `<script src="./inject.js"></script>`,
        }
    }})
  ]
})


// import fs					from "node:fs";
// import path					from "node:path";
// import { ProgressPlugin }	from "webpack";
// import HtmlWebpackPlugin	from "html-webpack-plugin";
// import MiniCssExtractPlugin from "mini-css-extract-plugin";
// import type webpack			from "webpack";

// import { assetLoader, scssLoader, tsLoader }	from "./webpack.buildHelpers"
// import type { BuildMode, BuildPaths }			from "./webpack.buildHelpers";

// const appDir = fs.realpathSync(process.cwd());
// const srcDir = "src";
// const frontDir = "front";
// const pubDir = "public";
// import fs					from "node:fs";
// import path					from "node:path";
// import { ProgressPlugin }	from "webpack";
// import type webpack			from "webpack";

// import { tsLoader }						from "./webpack.buildHelpers";
// import type { BuildMode, BuildPaths }	from "./webpack.buildHelpers"

// const nodeExternals = require('webpack-node-externals');

// const appDir = fs.realpathSync(process.cwd());
// const srcDir = "src";
// const backDir = "back";