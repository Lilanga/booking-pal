const path = require('node:path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  context: `${__dirname}/src`,
  entry: './entry.js',

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'),
    publicPath: './build/',
    globalObject: 'this',
    clean: true
  },

  // Enable tree shaking
  mode: 'development',

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: [
            ['@babel/preset-env', {
              modules: false, // Preserve ES6 modules for tree shaking
              useBuiltIns: 'usage',
              corejs: 3
            }], 
            '@babel/preset-react'
          ]
        }
      },
      {
        test: /\.scss$/,
        use: ['style-loader','css-loader','resolve-url-loader','sass-loader']
      },
      {
        test: /\.(otf|eot|svg|ttf|woff|woff2)$/,
        generator: {
          filename: './fonts/[name][ext]',
        },
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  
  target: 'electron-renderer',

  resolve: {
    fallback: {
      "global": false,
      "process": false,
      "Buffer": false
    },
    // Improve module resolution for tree shaking
    mainFields: ['es2015', 'module', 'main']
  },

  optimization: {
    usedExports: true, // Mark unused exports for tree shaking
    sideEffects: false, // Enable aggressive tree shaking
  },


  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: '../static/icons', to: 'icons' }
      ]
    }),
    new webpack.DefinePlugin({
      global: 'globalThis',
    }),
    new webpack.ProvidePlugin({
      global: 'globalThis',
    })
  ],

  devtool: 'eval-source-map',
};
