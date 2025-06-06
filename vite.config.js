import { defineConfig } from 'vite'
import image from '@rollup/plugin-image'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist/front',
    rollupOptions: {
      input: {
        main: 'index.html',
        game: 'src/front/game.ts',
        chat: 'src/front/chat.ts'
      }
    }
  },
  plugins: [
    image()
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