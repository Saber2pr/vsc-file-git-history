/**
 * Web Extension 的 webpack 配置
 * 将代码打包成单个文件供 web extension host 使用
 */
const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/web/extension.ts',
  target: 'webworker',
  output: {
    path: path.resolve(__dirname, 'dist/web'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    vscode: 'commonjs vscode', // vscode 模块由运行时提供
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.web.json'),
            },
          },
        ],
      },
    ],
  },
  plugins: [],
  resolveLoader: {
    modules: ['node_modules'],
  },
  devtool: 'source-map',
}

