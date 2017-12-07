'use strict';

module.exports = {
    semi: true,
    tabWidth: 4,
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'always',
    overrides: [
        {
            files: '*.js',
            excludeFiles: '*/**',
            options: {
                trailingComma: 'es5',
            },
        },
    ],
};
