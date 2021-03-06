'use strict';

const getWebpackVersion = () => require('./webpack-version');

describe('webpackVersion', () => {
    test('returns major only and is type number', () => {
        jest.doMock('read-pkg-up', () => ({
            sync: () => ({ pkg: { version: '4.29.0' } }),
        }));

        const version = getWebpackVersion();
        expect(version).toEqual('4.29.0');
    });

    test('handles alpha', () => {
        jest.doMock('read-pkg-up', () => ({
            sync: () => ({ pkg: { version: '5.0.0-alpha.8' } }),
        }));

        const version = getWebpackVersion();
        expect(version).toEqual('5.0.0-alpha.8');
    });

    test('returns null if no version found', () => {
        jest.doMock('read-pkg-up', () => ({ sync: () => ({ pkg: {} }) }));

        const version = getWebpackVersion();
        expect(version).toEqual(null);
    });
});
