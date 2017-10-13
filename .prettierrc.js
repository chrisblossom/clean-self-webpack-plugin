'use strict';

module.exports = {
    semi: true,
    'tab-width': 4,
    'single-quote': true,
    'trailing-comma': 'all',
    overrides: [
        {
            files: './*.js',
            options: {
                'trailing-comma': 'es5',
            },
        },
    ],
};
