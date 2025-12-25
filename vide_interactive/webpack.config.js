const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackObfuscator = require("webpack-obfuscator");

module.exports = {
  entry: "./src/js/main.js",

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              url: false, // ❗ ignore url(...) so fonts are not resolved at build
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),

    new WebpackObfuscator(
      {
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        stringArray: true,
        stringArrayEncoding: ["base64"],
        stringArrayThreshold: 0.8,
      },
      []
    ),
  ],

  devtool: false,
  mode: "production",
};
