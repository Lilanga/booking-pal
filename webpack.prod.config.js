const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const prodConfig = require('./webpack.config');

prodConfig.mode = 'production';
prodConfig.devtool = 'source-map';

prodConfig.optimization = {
  ...prodConfig.optimization,
  minimize: true,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log statements
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.warn'] // Remove specific functions
        },
        mangle: true,
      },
    }),
  ],
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
      common: {
        minChunks: 2,
        chunks: 'all',
        enforce: true
      }
    }
  }
};

// Merge plugins to ensure all DefinePlugin and ProvidePlugin settings are preserved
prodConfig.plugins = [
  ...prodConfig.plugins, // Preserve existing plugins from base config (includes DefinePlugin and ProvidePlugin)
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production')
    },
    // Ensure global is still defined in production
    global: 'globalThis'
  }),
  new HtmlWebpackPlugin({
    template: './template.html',
    filename: '../index.html', // Output to root directory
    inject: 'body',
    minify: {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true
    }
  }),
  new CopyWebpackPlugin({
    patterns: [
      { from: '../static/icons', to: 'icons' }
    ]
  })
];

prodConfig.output = {
  ...prodConfig.output, // Preserve existing output settings (including globalObject)
  filename: '[name].[contenthash].js',
  path: `${__dirname}/dist`,
  publicPath: './dist/',
  clean: true
};

// Ensure electron-renderer target is preserved
prodConfig.target = 'electron-renderer';

module.exports = prodConfig;
