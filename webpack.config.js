const defaultConfig = require("@wordpress/scripts/config/webpack.config");
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
    module: {
        ...defaultConfig.module,
        rules: [
            ...defaultConfig.module.rules,

            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }

        ],
    },
    resolve: {
        ...defaultConfig.resolve,
        extensions: [".tsx", ".ts", "js", "jsx"],
    },
    entry,
    output: {
        filename: "js/[name].js",
        path: path.join(__dirname, "assets/build"),
        clean: false,
    },
};