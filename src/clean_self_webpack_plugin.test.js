import path from 'path';
import {
    appendFileSync,
    existsSync,
    lstatSync,
    mkdirSync,
    readdirSync,
    writeFileSync,
} from 'fs';
import webpack from 'webpack';
import del from 'del';
import CleanSelfWebpackPlugin from './clean_self_webpack_plugin';

const sandboxDir = path.resolve(process.cwd(), '__sandbox__');
const entryFile = path.resolve(sandboxDir, 'src/entry.js');
const buildDir = path.resolve(sandboxDir, 'build/');
const srcDir = path.resolve(sandboxDir, 'src/');

function createSrcBundle(numberOfBundles = 1) {
    del.sync(
        [
            path.resolve(srcDir, '**/*'),
            `!${path.resolve(srcDir, '.gitignore')}`,
        ],
        { dot: true },
    );

    /**
     * setup initial dummy entryFile
     */
    writeFileSync(entryFile, `'use strict';\n\n`);

    let count = 1;
    while (count < numberOfBundles) {
        const filename = `${count}.js`;

        appendFileSync(
            entryFile,
            `require.ensure([], function(require){ require('./${filename}')}, '${count}');\n`,
        );

        writeFileSync(
            path.resolve(sandboxDir, `src/${filename}`),
            `'use strict';\n\nmodule.exports = '${filename}';\n`,
        );

        count += 1;
    }
}

/**
 * Clean ALL files in sandbox's src and build directories
 */
function cleanSandbox() {
    del.sync(
        [
            path.resolve(buildDir, '**/*'),
            path.resolve(srcDir, '**/*'),
            `!${path.resolve(srcDir, '.gitignore')}`,
            `!${path.resolve(buildDir, '.gitignore')}`,
        ],
        { dot: true },
    );
}

function createStaticFiles() {
    writeFileSync(
        path.resolve(sandboxDir, 'build/static2.txt'),
        'static2.txt\n',
    );

    writeFileSync(
        path.resolve(sandboxDir, 'build/static1.js'),
        `'use strict';\n\nmodule.exports = 'static1.js';\n`,
    );
}

function resetSandbox() {
    /**
     * Prepare directories
     */
    cleanSandbox();

    /**
     * Add static files that are not part of the webpack bundle
     */
    createStaticFiles();

    /**
     * Create initial entry.js without any additional bundles
     */
    createSrcBundle(1);
}

/**
 * returns a recursive flattened list of files inside a directory
 *
 * Example:
 * [
 *     'js/bundle.js',
 *     'js/chunks/0.bundle.js',
 *     'static1.js',
 *     'static2.txt',
 * ]
 */
function getBuildFiles(rootDir) {
    const getFiles = (dir, basePath = '.') => {
        return readdirSync(dir).reduce((acc, file) => {
            const pathname = path.resolve(rootDir, basePath, file);

            if (lstatSync(pathname).isDirectory()) {
                const nestedDir = getFiles(pathname, path.join(basePath, file));

                return [...acc, ...nestedDir];
            }

            const relativePath = path.join(basePath, file);

            return [...acc, relativePath];
        }, []);
    };

    const files = getFiles(rootDir);

    return files;
}

function createSandbox() {
    if (existsSync(sandboxDir) === false) {
        mkdirSync(sandboxDir);
    }

    if (existsSync(buildDir) === false) {
        mkdirSync(buildDir);
    }

    if (existsSync(srcDir) === false) {
        mkdirSync(srcDir);
    }
}

describe('CleanSelfWebpackPlugin', () => {
    let consoleSpy;

    beforeAll(() => {
        createSandbox();
    });

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        resetSandbox();
    });

    afterEach(() => {
        consoleSpy.mockReset();
    });

    afterAll(() => {
        cleanSandbox();
    });

    it('adds files to current assets', (done) => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();
        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        compiler.run(() => {
            expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                '1.bundle.js',
                'bundle.js',
            ]);

            done();
        });
    });

    it('removes only webpack files', (done) => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        compiler.run(() => {
            expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                '1.bundle.js',
                'bundle.js',
            ]);

            createSrcBundle(1);
            compiler.run(() => {
                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                    'bundle.js',
                ]);

                expect(getBuildFiles(buildDir)).toEqual([
                    'bundle.js',
                    'static1.js',
                    'static2.txt',
                ]);

                done();
            });
        });
    });

    it('removes nested files', (done) => {
        createSrcBundle(3);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'js/bundle.js',
                chunkFilename: 'js/chunks/[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        compiler.run(() => {
            expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                'js/chunks/2.bundle.js',
                'js/chunks/1.bundle.js',
                'js/bundle.js',
            ]);

            createSrcBundle(2);
            compiler.run(() => {
                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                    'js/chunks/1.bundle.js',
                    'js/bundle.js',
                ]);

                expect(getBuildFiles(buildDir)).toEqual([
                    'js/bundle.js',
                    'js/chunks/1.bundle.js',
                    'static1.js',
                    'static2.txt',
                ]);

                done();
            });
        });
    });

    it('does nothing when nothing changes or files added but not removed', (done) => {
        createSrcBundle(1);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();
        const removeFilesSpy = jest.spyOn(
            cleanSelfWebpackPlugin,
            'removeFiles',
        );

        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        compiler.run(() => {
            expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

            compiler.run(() => {
                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                    'bundle.js',
                ]);

                expect(getBuildFiles(buildDir)).toEqual([
                    'bundle.js',
                    'static1.js',
                    'static2.txt',
                ]);

                createSrcBundle(2);
                compiler.run(() => {
                    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                        '1.bundle.js',
                        'bundle.js',
                    ]);

                    expect(getBuildFiles(buildDir)).toEqual([
                        '1.bundle.js',
                        'bundle.js',
                        'static1.js',
                        'static2.txt',
                    ]);

                    expect(removeFilesSpy).not.toHaveBeenCalled();

                    done();
                });
            });
        });
    });

    /**
     * customPatterns option
     */
    it('removes with customPatterns', (done) => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            customPatterns: ['static*.*', '!static1.js'],
        });

        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        compiler.run(() => {
            expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                '1.bundle.js',
                'bundle.js',
            ]);

            expect(getBuildFiles(buildDir)).toEqual([
                '1.bundle.js',
                'bundle.js',
                'static1.js',
            ]);

            createSrcBundle(1);
            compiler.run(() => {
                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                    'bundle.js',
                ]);

                expect(getBuildFiles(buildDir)).toEqual([
                    'bundle.js',
                    'static1.js',
                ]);

                done();
            });
        });
    });

    /**
     * dryRun option
     */
    it('respects dryRun option (force verbose)', (done) => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            dryRun: true,
            verbose: false,
        });

        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        compiler.run(() => {
            expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                '1.bundle.js',
                'bundle.js',
            ]);

            createSrcBundle(1);
            compiler.run(() => {
                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                    'bundle.js',
                ]);

                expect(getBuildFiles(buildDir)).toEqual([
                    '1.bundle.js',
                    'bundle.js',
                    'static1.js',
                    'static2.txt',
                ]);

                expect(consoleSpy).toHaveBeenCalledWith(
                    'clean-self-webpack-plugin: dryRun 1.bundle.js',
                );

                done();
            });
        });
    });

    /**
     * Verbose option
     */
    it('respects verbose option - true', (done) => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            verbose: true,
        });

        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        compiler.run(() => {
            createSrcBundle(1);
            compiler.run(() => {
                expect(consoleSpy).toHaveBeenCalledWith(
                    'clean-self-webpack-plugin: removed 1.bundle.js',
                );

                done();
            });
        });
    });

    it('respects verbose option - false', (done) => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            verbose: false,
        });

        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        compiler.run(() => {
            createSrcBundle(1);
            compiler.run(() => {
                expect(consoleSpy).not.toHaveBeenCalled();

                done();
            });
        });
    });

    /**
     * initialPatterns option
     */
    it('handles the initialPatterns option (only calls once)', (done) => {
        createSrcBundle(1);

        const initialBuildFiles = getBuildFiles(buildDir);
        expect(initialBuildFiles).toEqual(['static1.js', 'static2.txt']);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            initialPatterns: ['static2.txt'],
        });

        const compiler = webpack({
            entry: entryFile,
            output: {
                path: buildDir,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        compiler.run(() => {
            expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

            expect(getBuildFiles(buildDir)).toEqual([
                'bundle.js',
                'static1.js',
            ]);

            createStaticFiles();
            compiler.run(() => {
                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                    'bundle.js',
                ]);

                expect(getBuildFiles(buildDir)).toEqual([
                    'bundle.js',
                    'static1.js',
                    'static2.txt',
                ]);

                done();
            });
        });
    });
});
