'use strict';

module.exports = {
    extends: ['airbnb-base', 'plugin:jest/recommended', 'prettier'],
    parserOptions: {
        sourceType: 'module',
        ecmaFeatures: {
            jsx: false,
            experimentalObjectRestSpread: true,
        },
    },
    env: {
        browser: false,
        node: true,
        jest: true,
    },
    plugins: ['jest'],
    rules: {
        'arrow-body-style': ['error', 'always'],
        'import/prefer-default-export': 'off'
    },
};
