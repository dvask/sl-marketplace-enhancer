const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        content: './src/content.js',
        options: './src/options.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/popup.html', to: 'popup.html' },
                { from: 'src/manifest.firefox.json', to: 'manifest.firefox.json' },
                { from: 'src/manifest.chrome.json', to: 'manifest.chrome.json' },
                { from: 'src/icons', to: 'icons' }
            ]
        })
    ]
};
