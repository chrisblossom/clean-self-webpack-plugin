# clean-self-webpack-plugin

[![npm](https://img.shields.io/npm/v/clean-self-webpack-plugin.svg?label=npm%20version)](https://www.npmjs.com/package/clean-self-webpack-plugin)
[![Linux Build Status](https://img.shields.io/circleci/project/github/chrisblossom/clean-self-webpack-plugin/master.svg?label=linux%20build)](https://circleci.com/gh/chrisblossom/clean-self-webpack-plugin/tree/master)
[![Windows Build Status](https://img.shields.io/appveyor/ci/chrisblossom/clean-self-webpack-plugin/master.svg?label=windows%20build)](https://ci.appveyor.com/project/chrisblossom/clean-self-webpack-plugin/branch/master)
[![Code Coverage](https://img.shields.io/codecov/c/github/chrisblossom/clean-self-webpack-plugin/master.svg)](https://codecov.io/gh/chrisblossom/clean-self-webpack-plugin/branch/master)

Webpack plugin to delete extraneous files created by Webpack

> NOTE: Node v6+ and Webpack v2+ are supported and tested.

## About

By default, this plugin will only remove files created by Webpack after compilation has completed.
Zero config required. Although it can be configured to remove other files, it is not recommended.

## Installation

`npm install --save-dev clean-self-webpack-plugin`

## Usage

```js
import webpack from 'webpack';
import path from 'path';
import del from 'del';
import CleanSelfWebpackPlugin from 'clean-self-webpack-plugin';

const outputPath = path.resolve(process.cwd(), 'build');

/*
 * Remove project files before webpack is loaded.
 * Be sure it is not async.
 *
 * It is HIGHLY recommended to handle the initial
 * build directory clean outside of this plugin / webpack.
 *
 * Popular existing packages:
 * https://github.com/isaacs/rimraf
 * https://github.com/sindresorhus/del
 *    -- I prefer this one, great glob support and has CLI (del-cli package)
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
     * Neither of these options are recommended.
     * Use only if you know what you are doing.
     *
     * They are unsafe...so test initially with dryRun: true.
     *
     * Relative to Webpack's output.path directory.
     * If outside of webpack's output.path directory,
     *    use path.resolve(process.cwd(), '')
     *
     * These options extend del's pattern matching API.
     * See https://github.com/sindresorhus/del#patterns
     *    for pattern matching documentation
     */

    /**
     * Custom pattern matching
     *
     * Removes files on after every build that match this pattern.
     * Used for files that are not created directly by Webpack.
     *
     * default: disabled
     */
    customPatterns: ['static*.*', '!static1.js'],

    /**
     * Removes files once prior to Webpack compilation
     *
     * Again, this should be handled outside of Webpack.
     * See Usage example.
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

-   [johnagan/clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)
-   [gpbl/webpack-cleanup-plugin](https://github.com/gpbl/webpack-cleanup-plugin)
-   [sindresorhus/del](https://github.com/sindresorhus/del)
