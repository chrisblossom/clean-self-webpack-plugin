'use strict';

const babel = {
    presets: [
        [
            'env',
            {
                targets: {
                    node: '4.0.0',
                },
            },
        ],
    ],
    plugins: ['transform-object-rest-spread'],
};

module.exports = babel;
