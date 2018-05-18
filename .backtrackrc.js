'use strict';

module.exports = {
    presets: [['@backtrack/node-module', { flow: false }]],

    packageJson: {
        scripts: {
            'test.watch': null,
        },
    },

    'test.ci-pretest': ['backtrack test.all'],

    files: {
        ignoreUpdates: ['.gitignore'],
    },

    'test.all': [
        'backtrack test.webpack2',
        'backtrack test.webpack3',
        'backtrack test.webpack4',
    ],

    'test.webpack2': [
        { name: 'install webpack 2', task: 'npm install --no-save webpack@2' },
        'backtrack test',
    ],

    'test.webpack3': [
        { name: 'install webpack 3', task: 'npm install --no-save webpack@3' },
        'backtrack test',
    ],

    'test.webpack4': [
        { name: 'install webpack 4', task: 'npm install --no-save webpack@4' },
        'backtrack test',
    ],
};
