const { join } = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = ({ production = false, minify = false, styles = true, entry = './src/main-umd-styles.ts' }) => {
    styles = styles === 'false' ? false : styles;
    const filename = `ag-grid-enterprise${minify ? '.min' : ''}${styles ? '' : '.noStyle'}.js`;

    console.log(`filename: ${filename}, minify: ${minify}, styles: ${styles}, entry: ${entry}`);

    const rules = [];
    if (!production) {
        // source map loader for dev
        rules.push({
            test: /\.cjs.js$/,
            enforce: 'pre',
            use: ['source-map-loader'],
        });
    }
    // ts loader for all configurations
    rules.push({
        test: /\.tsx?$/,
        loader: require.resolve('ts-loader'),
        exclude: /node_modules/,
        options: {
            configFile: join(__dirname, 'tsconfig.lib.json'),
        },
    });
    if (styles) {
        // styles if styles included..and post process css if minify is enabled
        rules.push({
            test: /\.css$/,
            use: [
                {
                    loader: 'style-loader',
                    options: {
                        attributes: {
                            'data-ag-scope': 'legacy',
                        },
                    },
                },
                'css-loader',
            ].concat(
                minify
                    ? {
                          loader: 'postcss-loader',
                          options: {
                              postcssOptions: {
                                  plugins: [
                                      [
                                          'postcss-preset-env',
                                          {
                                              // Options
                                          },
                                      ],
                                  ],
                              },
                          },
                      }
                    : []
            ),
        });
    }

    return {
        mode: production ? 'production' : 'development',
        devtool: production ? false : 'inline-source-map',
        entry: join(__dirname, entry),
        output: {
            path: join(__dirname, 'dist'),
            filename,
            library: 'agGrid',
            libraryTarget: 'umd',
        },
        module: {
            rules,
        },
        resolve: {
            extensions: ['.js', '.jsx', '.tsx', '.ts', '.html', '.scss'],
            modules: ['node_modules'],
        },
        optimization: {
            minimizer: !!minify
                ? [
                      new TerserPlugin({
                          terserOptions: {
                              output: {
                                  comments: false,
                              },
                          },
                          extractComments: false,
                      }),
                  ]
                : [],
        },
    };
};
