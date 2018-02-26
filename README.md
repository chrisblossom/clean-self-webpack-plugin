# Clean-Self-Webpack-Plugin

Webpack plugin to delete extraneous files created by Webpack

> NOTE: Webpack v2 and v3 are supported and tested. Webpack v1 is not supported.

## About

By default, this plugin will only remove files created by Webpack after compilation has completed.
Although it can be configured to remove other files, it is not recommended.

## Installation

`yarn add --dev clean-self-webpack-plugin` / `npm install --save-dev clean-self-webpack-plugin`

## Usage

```js
import webpack from 'webpack';
import path from 'path';
import del from 'del';
import CleanSelfWebpackPlugin from 'clean-self-webpack-plugin';

const outputPath = path.resolve(process.cwd(), 'build');

/*
 * Remove project files before webpack is loaded. Be sure it is not async.
 *
 * It is HIGHLY recommended to handle the initial build directory clean outside of this plugin / webpack.
 *
 * Popular existing packages:
 * https://github.com/isaacs/rimraf
 * https://github.com/sindresorhus/del -- I prefer this one, great glob support and has CLI (del-cli package)
 * https://github.com/jprichardson/node-fs-extra
 *
 */
del.sync([path.resolve(outputPath, '**/*')]);

const webpackConfig = {
    entry: path.resolve(process.cwd(), 'src/index.js'),
    output: {
        path: outputPath,
        filename: 'bundle.js',
    },
    plugins: [new CleanSelfWebpackPlugin()],
};

export default webpackConfig;
```

## Options

```js
new CleanSelfWebpackPlugin({
    /**
     * Simulate the removal of files
     *
     * default: false
     */
    dryRun: true,

    /**
     * Write Logs to Console
     * (Always enabled when dryRun is true)
     *
     * default: false
     */
    verbose: true,

    /**
     * **WARNING**
     *
     * Notes on the below options customPatterns and initialPatterns:
     *
     * Neither of these options are recommended. Use only if you know what you are doing.
     *
     * They are unsafe...so test initially with dryRun: true.
     *
     * Relative to Webpack's output.path directory. If outside of webpack's output.path directory, use path.resolve(process.cwd(), '')
     *
     * These options extend del's pattern matching API.
     * See https://github.com/sindresorhus/del#patterns for pattern matching documentation
     */

    /**
     * Custom pattern matching
     *
     * Removes files on after every build that match this pattern. Used for files that are not created directly by Webpack.
     *
     * default: disabled
     */
    customPatterns: ['static*.*', '!static1.js'],

    /**
     * Removes files once prior to Webpack compilation
     *
     * Again, this should be handled outside of Webpack. See Usage example.
     *
     * NOTE: customPatterns ARE included with this
     *
     * default: disabled
     */
    initialPatterns: ['*/**'],
});
```

## Thanks To / Related Projects

This package was created with the great work / lessons learned from:

* [johnagan/clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)
* [gpbl/webpack-cleanup-plugin](https://github.com/gpbl/webpack-cleanup-plugin)
* [sindresorhus/del](https://github.com/sindresorhus/del)
