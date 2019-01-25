/* eslint-disable import/no-extraneous-dependencies */

// @ts-ignore

'use strict';

/**
 * Used for testing purposes only
 */

const path = require('path');
const readPkgUp = require('read-pkg-up');

function getWebpackVersion() {
    const webpackPath = require.resolve('webpack');
    const { dir } = path.parse(webpackPath);

    const webpackPkg = readPkgUp.sync({ cwd: dir, normalize: false });

    const version = webpackPkg.pkg.version ? webpackPkg.pkg.version : null;

    if (version === null) {
        return null;
    }

    return version;
}

const webpackVersion = getWebpackVersion();

module.exports = webpackVersion;
