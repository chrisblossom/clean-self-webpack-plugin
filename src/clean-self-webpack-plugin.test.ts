import { Configuration, Stats } from 'webpack';
import TempSandbox from 'temp-sandbox';
import webpackVersion from '../utils/webpack-version';

const webpackMajor =
    webpackVersion !== null ? parseInt(webpackVersion.split('.')[0], 10) : null;

function webpack(options: Configuration = {}) {
    const webpackActual = require('webpack');

    // https://webpack.js.org/concepts/mode/
    if (
        options.mode === undefined &&
        options.mode !== null &&
        webpackMajor !== null &&
        webpackMajor >= 4
    ) {
        // eslint-disable-next-line no-param-reassign
        options.mode = 'development';
    }

    if (options.mode === null) {
        // eslint-disable-next-line no-param-reassign
        delete options.mode;
    }

    const compiler = webpackActual(options);

    const runAsync = () =>
        new Promise((resolve, reject) => {
            compiler.run((error: Error, stats: Stats) => {
                if (error || stats.hasErrors()) {
                    reject(error);

                    return;
                }

                resolve(stats);
            });
        });

    return { ...compiler, run: runAsync };
}

const CleanSelfWebpackPlugin: any = function CleanSelfWebpackPlugin(
    ...args: any
) {
    const CleanSelfWebpackPluginActual = require('./clean-self-webpack-plugin');
    const cleanSelfWebpackPlugin = new CleanSelfWebpackPluginActual(...args);
    return cleanSelfWebpackPlugin;
};

const sandbox = new TempSandbox({ randomDir: true });
const entryFile = 'src/index.js';
const entryFileFull = sandbox.path.resolve(entryFile);
const outputPath = 'dist';
const outputPathFull = sandbox.path.resolve(outputPath);
const sourcePath = 'src';

function createSrcBundle(numberOfBundles = 1) {
    sandbox.deleteSync(sourcePath);

    let entryFileContents = `'use strict';\n\n`;

    let count = 1;
    while (count < numberOfBundles) {
        const filename = `${count}.js`;

        entryFileContents = `${entryFileContents}
        require.ensure([], function(require){ require('./${filename}')}, '${count}');`;

        sandbox.createFileSync(
            `src/${filename}`,
            // eslint-disable-next-line no-useless-concat
            `'use strict';\n\n` + `module.exports = '${filename}';`,
        );

        count += 1;
    }

    sandbox.createFileSync(entryFile, entryFileContents);
}

function createStaticFiles() {
    sandbox.createFileSync('dist/.hidden.file', '.hidden.file');
    sandbox.createFileSync('dist/static2.txt', 'static2.txt');
    sandbox.createFileSync(
        'dist/static1.js',
        `'use strict';\n\nmodule.exports = 'static1.js';`,
    );
}

let consoleSpy: any;

const cwd = process.cwd();
beforeEach(() => {
    process.chdir(sandbox.dir);

    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    /**
     * Prepare directories
     */
    sandbox.cleanSync();

    /**
     * Add static files that are not part of the webpack bundle
     */
    createStaticFiles();

    /**
     * Create initial entry.js without any additional bundles
     */
    createSrcBundle(1);
});

afterEach(() => {
    process.chdir(cwd);
    consoleSpy.mockReset();
});

afterAll(() => {
    // delete sandbox and sandbox instance
    sandbox.destroySandboxSync();
    process.chdir(cwd);
});

test('adds files to current assets', async () => {
    createSrcBundle(2);

    const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();
    const options = {
        entry: entryFileFull,
        output: {
            path: outputPathFull,
            filename: 'bundle.js',
            chunkFilename: '[name].bundle.js',
        },
        plugins: [cleanSelfWebpackPlugin],
    };

    const compiler = webpack(options);

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
        '1.bundle.js',
        'bundle.js',
    ]);
});

test('removes only webpack files', async () => {
    createSrcBundle(2);

    const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

    const compiler = webpack({
        entry: entryFileFull,
        output: {
            path: outputPathFull,
            filename: 'bundle.js',
            chunkFilename: '[name].bundle.js',
        },
        plugins: [cleanSelfWebpackPlugin],
    });

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
        '1.bundle.js',
        'bundle.js',
    ]);

    createSrcBundle(1);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

    expect(sandbox.getFileListSync(outputPathFull)).toEqual([
        '.hidden.file',
        'bundle.js',
        'static1.js',
        'static2.txt',
    ]);
});

test('removes nested files', async () => {
    createSrcBundle(3);

    const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

    const compiler = webpack({
        entry: entryFileFull,
        output: {
            path: outputPathFull,
            filename: 'js/bundle.js',
            chunkFilename: 'js/chunks/[name].bundle.js',
        },
        plugins: [cleanSelfWebpackPlugin],
    });

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
        'js/bundle.js',
        'js/chunks/1.bundle.js',
        'js/chunks/2.bundle.js',
    ]);

    createSrcBundle(2);
    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
        'js/bundle.js',
        'js/chunks/1.bundle.js',
    ]);

    expect(sandbox.getFileListSync(outputPathFull)).toEqual([
        '.hidden.file',
        'js/bundle.js',
        'js/chunks/1.bundle.js',
        'static1.js',
        'static2.txt',
    ]);
});

test('does nothing when nothing changes or files added but not removed', async () => {
    createSrcBundle(1);

    const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();
    const removeFilesSpy = jest.spyOn(cleanSelfWebpackPlugin, 'removeFiles');

    const compiler = webpack({
        entry: entryFileFull,
        output: {
            path: outputPathFull,
            filename: 'bundle.js',
            chunkFilename: '[name].bundle.js',
        },
        plugins: [cleanSelfWebpackPlugin],
    });

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

    expect(sandbox.getFileListSync(outputPathFull)).toEqual([
        '.hidden.file',
        'bundle.js',
        'static1.js',
        'static2.txt',
    ]);

    createSrcBundle(2);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
        '1.bundle.js',
        'bundle.js',
    ]);

    expect(sandbox.getFileListSync(outputPathFull)).toEqual([
        '.hidden.file',
        '1.bundle.js',
        'bundle.js',
        'static1.js',
        'static2.txt',
    ]);

    expect(removeFilesSpy).not.toHaveBeenCalled();
});

test('removes map files', async () => {
    createSrcBundle(2);

    const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

    const compiler = webpack({
        entry: entryFileFull,
        output: {
            path: outputPathFull,
            filename: 'bundle.js',
            chunkFilename: '[name].bundle.js',
        },
        devtool: 'cheap-module-source-map',
        plugins: [cleanSelfWebpackPlugin],
    });

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
        '1.bundle.js',
        '1.bundle.js.map',
        'bundle.js',
        'bundle.js.map',
    ]);

    expect(sandbox.getFileListSync(outputPathFull)).toEqual([
        '.hidden.file',
        '1.bundle.js',
        '1.bundle.js.map',
        'bundle.js',
        'bundle.js.map',
        'static1.js',
        'static2.txt',
    ]);

    createSrcBundle(1);

    await compiler.run();

    expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
        'bundle.js',
        'bundle.js.map',
    ]);

    expect(sandbox.getFileListSync(outputPathFull)).toEqual([
        '.hidden.file',
        'bundle.js',
        'bundle.js.map',
        'static1.js',
        'static2.txt',
    ]);
});

describe('customPatterns option', () => {
    test('removes with customPatterns', async () => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            customPatterns: ['static*.*', '!static1.js'],
        });

        const compiler = webpack({
            entry: entryFileFull,
            output: {
                path: outputPathFull,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
            '1.bundle.js',
            'bundle.js',
        ]);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual([
            '.hidden.file',
            '1.bundle.js',
            'bundle.js',
            'static1.js',
        ]);

        createSrcBundle(1);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual([
            '.hidden.file',
            'bundle.js',
            'static1.js',
        ]);
    });
});

describe('dryRun option', () => {
    test('respects dryRun option (force verbose)', async () => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            dryRun: true,
            verbose: false,
        });

        const compiler = webpack({
            entry: entryFileFull,
            output: {
                path: outputPathFull,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
            '1.bundle.js',
            'bundle.js',
        ]);

        createSrcBundle(1);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual([
            '.hidden.file',
            '1.bundle.js',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);

        expect(consoleSpy).toHaveBeenCalledWith(
            'clean-self-webpack-plugin: dryRun 1.bundle.js',
        );
    });
});

describe('verbose option', () => {
    test('respects verbose option - true', async () => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            verbose: true,
        });

        const compiler = webpack({
            entry: entryFileFull,
            output: {
                path: outputPathFull,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        await compiler.run();

        createSrcBundle(1);

        await compiler.run();

        expect(consoleSpy).toHaveBeenCalledWith(
            'clean-self-webpack-plugin: removed 1.bundle.js',
        );
    });

    test('respects verbose option - false', async () => {
        createSrcBundle(2);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            verbose: false,
        });

        const compiler = webpack({
            entry: entryFileFull,
            output: {
                path: outputPathFull,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        await compiler.run();
        createSrcBundle(1);
        await compiler.run();

        expect(consoleSpy).not.toHaveBeenCalled();
    });
});

describe('initialPatterns option', () => {
    test('handles the initialPatterns option (only calls once)', async () => {
        createSrcBundle(1);

        const initialBuildFiles = sandbox.getFileListSync(outputPathFull);
        expect(initialBuildFiles).toEqual([
            '.hidden.file',
            'static1.js',
            'static2.txt',
        ]);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            initialPatterns: ['static2.txt'],
        });

        const compiler = webpack({
            entry: entryFileFull,
            output: {
                path: outputPathFull,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual([
            '.hidden.file',
            'bundle.js',
            'static1.js',
        ]);

        createStaticFiles();

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual([
            '.hidden.file',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);
    });

    test('handles the initialPatterns removes all files with **/*', async () => {
        createSrcBundle(1);

        const initialBuildFiles = sandbox.getFileListSync(outputPathFull);
        expect(initialBuildFiles).toEqual([
            '.hidden.file',
            'static1.js',
            'static2.txt',
        ]);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            initialPatterns: ['**/*'],
        });

        const compiler = webpack({
            entry: entryFileFull,
            output: {
                path: outputPathFull,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual(['bundle.js']);

        createStaticFiles();

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual([
            '.hidden.file',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);
    });
});

describe('webpack errors', () => {
    test('does nothing when webpack errors are present', async () => {
        createSrcBundle(2);

        const initialBuildFiles = sandbox.getFileListSync(outputPathFull);
        expect(initialBuildFiles).toEqual([
            '.hidden.file',
            'static1.js',
            'static2.txt',
        ]);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin({
            verbose: true,
        });

        const compiler = webpack({
            entry: entryFileFull,
            output: {
                path: outputPathFull,
                filename: 'bundle.js',
                chunkFilename: '[name].bundle.js',
            },
            plugins: [cleanSelfWebpackPlugin],
        });

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
            '1.bundle.js',
            'bundle.js',
        ]);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual([
            '.hidden.file',
            '1.bundle.js',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);

        expect(consoleSpy.mock.calls).toEqual([]);

        /**
         * remove entry file to create webpack compile error
         */
        sandbox.deleteSync(entryFile);

        try {
            await compiler.run();
            // eslint-disable-next-line no-empty
        } catch (error) {}

        expect(consoleSpy.mock.calls).toEqual([
            ['clean-self-webpack-plugin: pausing due to webpack errors'],
        ]);

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
            '1.bundle.js',
            'bundle.js',
        ]);

        expect(sandbox.getFileListSync(outputPathFull)).toEqual([
            '.hidden.file',
            '1.bundle.js',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);
    });

    test('handles no options.output', () => {
        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

        cleanSelfWebpackPlugin.apply({ options: {} });

        expect(consoleSpy.mock.calls).toEqual([
            [
                'clean-self-webpack-plugin: options.output.path not defined. Plugin disabled...',
            ],
        ]);
    });

    test('handles no output.path', () => {
        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

        cleanSelfWebpackPlugin.apply({ options: { output: {} } });

        expect(consoleSpy.mock.calls).toEqual([
            [
                'clean-self-webpack-plugin: options.output.path not defined. Plugin disabled...',
            ],
        ]);
    });
});

describe('webpack >= 4 only', () => {
    if (webpackMajor !== null && webpackMajor >= 4) {
        test('works without config', async () => {
            createSrcBundle(2);

            const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

            // @ts-ignore
            const compiler = webpack({
                // internal test option to remove mode
                mode: null,
                plugins: [cleanSelfWebpackPlugin],
            });

            expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

            await compiler.run();

            expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                '1.js',
                'main.js',
            ]);

            createSrcBundle(1);

            await compiler.run();

            expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['main.js']);

            expect(sandbox.getFileListSync(outputPathFull)).toEqual([
                '.hidden.file',
                'main.js',
                'static1.js',
                'static2.txt',
            ]);
        });
    }
});
