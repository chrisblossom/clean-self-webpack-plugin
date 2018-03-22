/* eslint-disable strict */

'use strict';

module.exports = {
    moduleDirectories: ['node_modules'],
    testEnvironment: 'node',
    collectCoverage: false,
    coveragePathIgnorePatterns: ['/__sandbox__/'],

    /**
     * Automatically reset mock state between every test.
     * Equivalent to calling jest.resetAllMocks() between each test.
     *
     * Sane default with resetModules: true because mocks need to be inside beforeEach
     * for them to work correctly
     */
    resetMocks: true,

    /**
     *  The module registry for every test file will be reset before running each individual test.
     *  This is useful to isolate modules for every test so that local module state doesn't conflict between tests.
     */
    resetModules: true,
};
