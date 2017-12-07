/* eslint-disable global-require,strict */

'use strict';

module.exports = (wallaby) => {
    return {
        files: [
            'src/**/*.js',
            'jest.config.js',
            'src/**/*.snap',
            'src/**/__sandbox__/**/*',
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

        setup: (w) => {
            const jestConfig = require('./jest.config');
            w.testFramework.configure(jestConfig);
        },
    };
};
