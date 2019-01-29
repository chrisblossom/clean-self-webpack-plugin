'use strict';

const log = require('@backtrack/core/dist/utils/log').default;
const webpackVersion = require('./utils/webpack-version');

function getWebpackTestTasks() {
    const supported = ['next', '2', '3', '4'];

    const tasks = supported.reduce(
        (acc, version) => {
            const npmInstallTask = {
                name: `install webpack ${version}`,
                task: `npm install --no-save webpack@${version}`,
            };

            const result = {
                local: [
                    ...acc.local,
                    npmInstallTask,
                    { name: 'test', task: 'jest' },
                ],
                ci: [
                    ...acc.ci,
                    npmInstallTask,
                    {
                        name: 'test',
                        task: 'jest --ci --no-cache --coverage --max-workers 2',
                    },
                    { name: 'codecov', task: 'codecov' },
                ],
            };

            return result;
        },
        { ci: [], local: [] },
    );

    return tasks;
}

const webpackTestTasks = getWebpackTestTasks();

module.exports = {
    presets: [['@backtrack/node-module', { typescript: true }]],

    'test.ci': [false, ...webpackTestTasks.ci],

    'test.all': webpackTestTasks.local,

    config: {
        jest: (config) => {
            log.info(`webpack version detected: ${webpackVersion}`);

            return config;
        },

        eslint: {
            overrides: [
                {
                    files: 'utils/**/*.js',
                    parserOptions: {
                        sourceType: 'script',
                    },
                    rules: {
                        strict: ['error', 'safe'],

                        'node/no-unsupported-features/es-builtins': 'error',
                        'node/no-unsupported-features/es-syntax': 'error',
                        'node/no-unsupported-features/node-builtins': 'error',
                    },
                },
            ],
        },
    },
};
