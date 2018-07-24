'use strict';

function getWebpackTestTasks({ ci = false } = {}) {
    const supported = ['2', '3', '4'];

    const tasks = supported.reduce((acc, version) => {
        const result = [
            ...acc,
            {
                name: `install webpack ${version}`,
                task: `npm install --no-save webpack@${version}`,
            },
        ];

        if (ci === false) {
            result.push({
                name: 'test',
                task: 'jest',
            });

            return result;
        }

        result.push({
            name: 'test',
            task: 'jest --coverage --maxWorkers 2',
        });

        result.push({
            name: 'codecov',
            task: 'codecov',
        });

        return result;
    }, []);

    return tasks;
}

module.exports = {
    presets: [['@backtrack/node-module', { flow: false }]],

    packageJson: {
        scripts: {
            // jest --watch is broken here because of sandbox directory updates
            'test.watch': null,
        },
    },

    'test.ci': [false, ...getWebpackTestTasks({ ci: true })],

    files: {
        ignoreUpdates: ['.gitignore'],
    },

    'test.all': getWebpackTestTasks({ ci: false }),
};
