'use strict';

const babel = {
    presets: [
        [
            'env',
            {
                targets: {
                    node: '6.9.0',
                },
            },
        ],
    ],
    plugins: ['transform-object-rest-spread'],
};

module.exports = babel;
