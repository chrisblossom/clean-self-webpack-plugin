/* eslint-disable global-require,strict */

'use strict';

module.exports = wallaby => {
    return {
        files: [
            'src/**/*.js',
            'jest.config.js',
            // '__sandbox__/**/*', // I don't think this is necessary because it is created by the tests
            '!src/**/*.test.js',
        ],

        tests: ['src/**/*.test.js'],

        env: {
            type: 'node',
            runner: 'node',
        },

        compilers: {
            '**/*.js': wallaby.compilers.babel(),
        },

        testFramework: 'jest',

        // https://github.com/wallabyjs/public/issues/465
        workers: { initial: 1, regular: 1 },

        setup: w => {
            const jestConfig = require('./jest.config');
            w.testFramework.configure(jestConfig);
        },
    };
};
