const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: `${__dirname}/src`,
  entry: './entry.js',

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
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
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: '../static/icons', to: 'icons' }
      ]
    })
  ],
  target: 'electron-renderer',

  devtool: 'eval-source-map',
};
