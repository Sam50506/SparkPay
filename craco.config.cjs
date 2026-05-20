import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const webpack = require('webpack');

export default {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        buffer: require.resolve('buffer/'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        assert: require.resolve('assert/'),
        process: require.resolve('process/browser.js'),
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
      };
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser.js',
        }),
      ];
      return webpackConfig;
    },
  },
};
