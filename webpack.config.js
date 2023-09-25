const webpack = require('webpack');

module.exports = {
  context: __dirname + '/src',
  entry: './entry.js',

  output: {
    filename: 'bundle.js',
    path: __dirname + '/build',
    publicPath: 'http://localhost:8080/build/'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react']
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
      }
    ]
  },

  target: 'electron-renderer',

  devtool: 'eval-source-map',
};
