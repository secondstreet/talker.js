const path = require("path");

const common = {
  entry: "./src/index.ts",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  }
};

module.exports = [
  {
    ...common,
    output: {
      filename: "talker.min.js",
      library: "Talker",
      libraryTarget: "var",
      path: path.resolve(__dirname, "dist")
    }
  },
  {
    ...common,
    output: {
      filename: "talker.min.js",
      library: "talker",
      libraryTarget: "amd",
      path: path.resolve(__dirname, "dist/named_amd")
    }
  },
  {
    ...common,
    output: {
      filename: "talker.min.js",
      library: "talker",
      libraryTarget: "commonjs2",
      path: path.resolve(__dirname, "dist/common_js")
    }
  },
  {
    ...common,
    output: {
      filename: "talker.min.js",
      library: "",
      libraryTarget: "amd",
      path: path.resolve(__dirname, "dist/amd")
    }
  },
  {
    ...common,
    output: {
      filename: "talker.min.js",
      library: "talker",
      libraryTarget: "umd",
      path: path.resolve(__dirname, "dist/umd")
    }
  }
];
