const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const plugins = [
  new webpack.DefinePlugin({
    'process.env': JSON.stringify({
      NODE_ENV: process.env.NODE_ENV,
      API_URL: process.env.API_URL,
      APP_NAME: process.env.APP_NAME,
      ASSETS_URL: process.env.ASSETS_URL,
      APP_LOGO: process.env.APP_LOGO,
      GOOGLE_GEOCODER_KEY: process.env.GOOGLE_GEOCODER_KEY,
      WWW_NAME: process.env.WWW_NAME,
      WWW_URL: process.env.WWW_URL,
      WWW_DOMAIN: process.env.WWW_DOMAIN,
    }),
  }),
]

const entries = []

if (process.env.NODE_ENV !== 'production') {
  entries.push('webpack-hot-middleware/client?noInfo=true&reload=true')
  plugins.push(new webpack.HotModuleReplacementPlugin())
}

entries.push(path.join(__dirname, 'browser.js'))

module.exports = {
  context: __dirname,
  devtool: 'source-map',
  entry: entries,
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!(hyperhtml))/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [[require.resolve('babel-preset-env'), {
              targets: {
                browsers: ["last 3 versions", "IE >= 11", "safari >= 7"]
              },
              useBuiltIns: 'entry',
            }]],
            plugins: [
              'babel-plugin-syntax-dynamic-import',
              'babel-plugin-transform-object-rest-spread',
            ].map(require.resolve)
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [
      // we specify a custom UglifyJsPlugin here to get source maps in production
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        uglifyOptions: {
          compress: {
            pure_funcs: ['console.debug', 'console.group', 'console.groupEnd'],
          },
          ecma: 6,
          mangle: true,
          keep_classnames: true,
          keep_fnames: true,
        },
        sourceMap: true,
      })
    ],
  },
  output: {
    path: '/',
    filename: '[hash].js',
    publicPath: '/hyperloop/'
  },
  plugins,
  resolve: {
    alias: {
      'hyperhtml': 'hyperhtml/cjs',
      'viperhtml': 'hyperhtml/cjs/index'
    }
  },
  target: 'web',
}
