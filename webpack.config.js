const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const path = require("path");
const isProduction = "production" === process.env.NODE_ENV;

let entryPoints = require('./entryPoints');
let entry = {};
entryPoints.forEach(
    (entryPoint) => {
        entry[entryPoint] = path.resolve(process.cwd(), `assets/src/${entryPoint}/index.js`);
    }
);

module.exports = {
    mode: isProduction ? "production" : "development",
    ...defaultConfig,
    plugins: [new MiniCssExtractPlugin({
        filename: function (output) {
            var filename = output.filename.replace("style", "").replace("editor", "");
            return "[" + filename + "]/[" + filename + "].css";
        },
    })],

    module: {
        ...defaultConfig.module,
        rules: [
            ...defaultConfig.module.rules,

            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
        ],
    },
    resolve: {
        ...defaultConfig.resolve,
        extensions: [".tsx", ".ts", "js", "jsx"],
    },
    entry,
    output: {
        filename: "[name]/[name].js",
        path: path.join(__dirname, "assets/build"),
        clean: false,
    },
};
