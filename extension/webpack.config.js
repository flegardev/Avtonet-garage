const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => ({
  entry: {
    background: './src/background/service-worker.js',
    content: './src/content/index.js',
    popup: './src/popup/index.jsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@components': path.resolve(__dirname, 'src/popup/components'),
    },
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new CopyPlugin({
      patterns: [
        { from: 'src/popup/index.html', to: 'popup.html' },
        { from: 'src/icons', to: 'icons', noErrorOnMissing: true },
        { from: 'manifest.json', to: 'manifest.json' },
      ],
    }),
  ],
  optimization: {
    splitChunks: false,
  },
  devtool: argv.mode === 'development' ? 'cheap-module-source-map' : false,
});
