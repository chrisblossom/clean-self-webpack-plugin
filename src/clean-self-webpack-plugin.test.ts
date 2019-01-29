import { Configuration, Stats } from 'webpack';
import TempSandbox from 'temp-sandbox';
import webpackVersion from '../utils/webpack-version';

function webpack(options: Configuration = {}) {
    const webpackActual = require('webpack');

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

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _CleanSelfWebpackPlugin {
    constructor(...args: any) {
        const CleanSelfWebpackPluginActual = require('./clean-self-webpack-plugin');

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPluginActual(
            ...args,
        );

        return cleanSelfWebpackPlugin;
    }
}

/**
 * Silence typescript errors
 */
const CleanSelfWebpackPlugin: any = _CleanSelfWebpackPlugin;

const sandbox = new TempSandbox({ randomDir: true });
const entryFile = 'src/index.js';
const entryFileFull = sandbox.path.resolve(entryFile);
const outputPath = 'dist';
const outputPathFull = sandbox.path.resolve(outputPath);
const sourcePath = 'src';

async function createSrcBundle(numberOfBundles = 1) {
    await sandbox.delete(sourcePath);

    let entryFileContents = `'use strict';\n\n`;

    let count = 1;
    const pending = [];
    while (count < numberOfBundles) {
        const filename = `${count}.js`;

        entryFileContents = `${entryFileContents}
        require.ensure([], function(require){ require('./${filename}')}, '${count}');`;

        pending.push(
            sandbox.createFile(
                `src/${filename}`,
                // eslint-disable-next-line no-useless-concat
                `'use strict';\n\n` + `module.exports = '${filename}';`,
            ),
        );

        count += 1;
    }

    pending.push(sandbox.createFile(entryFile, entryFileContents));

    await Promise.all(pending);
}

async function createStaticFiles() {
    await Promise.all([
        sandbox.createFile('dist/static2.txt', 'static2.txt'),

        sandbox.createFile(
            'dist/static1.js',
            `'use strict';\n\nmodule.exports = 'static1.js';`,
        ),
    ]);
}

describe('CleanSelfWebpackPlugin', () => {
    let consoleSpy: any;

    const cwd = process.cwd();
    beforeEach(async () => {
        process.chdir(sandbox.dir);

        consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        /**
         * Prepare directories
         */
        await sandbox.clean();

        /**
         * Add static files that are not part of the webpack bundle
         */
        await Promise.all([
            createStaticFiles(),

            /**
             * Create initial entry.js without any additional bundles
             */
            createSrcBundle(1),
        ]);
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
        await createSrcBundle(2);

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
        await createSrcBundle(2);

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

        await createSrcBundle(1);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);
    });

    test('removes nested files', async () => {
        await createSrcBundle(3);

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

        await createSrcBundle(2);
        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
            'js/bundle.js',
            'js/chunks/1.bundle.js',
        ]);

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            'js/bundle.js',
            'js/chunks/1.bundle.js',
            'static1.js',
            'static2.txt',
        ]);
    });

    test('does nothing when nothing changes or files added but not removed', async () => {
        await createSrcBundle(1);

        const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();
        const removeFilesSpy = jest.spyOn(
            cleanSelfWebpackPlugin,
            'removeFiles',
        );

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

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);

        await createSrcBundle(2);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
            '1.bundle.js',
            'bundle.js',
        ]);

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            '1.bundle.js',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);

        expect(removeFilesSpy).not.toHaveBeenCalled();
    });

    /**
     * customPatterns option
     */
    test('removes with customPatterns', async () => {
        await createSrcBundle(2);

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

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            '1.bundle.js',
            'bundle.js',
            'static1.js',
        ]);

        await createSrcBundle(1);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            'bundle.js',
            'static1.js',
        ]);
    });

    /**
     * dryRun option
     */
    test('respects dryRun option (force verbose)', async () => {
        await createSrcBundle(2);

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

        await createSrcBundle(1);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            '1.bundle.js',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);

        expect(consoleSpy).toHaveBeenCalledWith(
            'clean-self-webpack-plugin: dryRun 1.bundle.js',
        );
    });

    /**
     * Verbose option
     */
    test('respects verbose option - true', async () => {
        await createSrcBundle(2);

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

        await createSrcBundle(1);

        await compiler.run();

        expect(consoleSpy).toHaveBeenCalledWith(
            'clean-self-webpack-plugin: removed 1.bundle.js',
        );
    });

    test('respects verbose option - false', async () => {
        await createSrcBundle(2);

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
        await createSrcBundle(1);
        await compiler.run();

        expect(consoleSpy).not.toHaveBeenCalled();
    });

    /**
     * initialPatterns option
     */
    test('handles the initialPatterns option (only calls once)', async () => {
        await createSrcBundle(1);

        const initialBuildFiles = await sandbox.getFileList(outputPathFull);
        expect(initialBuildFiles).toEqual(['static1.js', 'static2.txt']);

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

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            'bundle.js',
            'static1.js',
        ]);

        await createStaticFiles();

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual(['bundle.js']);

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);
    });

    /**
     * webpack errors
     */
    test('does nothing when webpack errors are present', async () => {
        await createSrcBundle(2);

        const initialBuildFiles = await sandbox.getFileList(outputPathFull);
        expect(initialBuildFiles).toEqual(['static1.js', 'static2.txt']);

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

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            '1.bundle.js',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);

        expect(consoleSpy.mock.calls).toEqual([]);

        /**
         * remove entry file to create webpack compile error
         */
        await sandbox.delete(entryFile);

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

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            '1.bundle.js',
            'bundle.js',
            'static1.js',
            'static2.txt',
        ]);
    });

    test('removes map files', async () => {
        await createSrcBundle(2);

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

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            '1.bundle.js',
            '1.bundle.js.map',
            'bundle.js',
            'bundle.js.map',
            'static1.js',
            'static2.txt',
        ]);

        await createSrcBundle(1);

        await compiler.run();

        expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
            'bundle.js',
            'bundle.js.map',
        ]);

        expect(await sandbox.getFileList(outputPathFull)).toEqual([
            'bundle.js',
            'bundle.js.map',
            'static1.js',
            'static2.txt',
        ]);
    });

    describe('webpack >= 4 only', () => {
        const webpackMajor =
            webpackVersion !== null
                ? parseInt(webpackVersion.split('.')[0], 10)
                : null;

        if (webpackMajor !== null && webpackMajor >= 4) {
            test('works without config', async () => {
                await createSrcBundle(2);

                const cleanSelfWebpackPlugin = new CleanSelfWebpackPlugin();

                const compiler = webpack({
                    plugins: [cleanSelfWebpackPlugin],
                });

                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([]);

                await compiler.run();

                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                    '1.js',
                    'main.js',
                ]);

                await createSrcBundle(1);

                await compiler.run();

                expect(cleanSelfWebpackPlugin.currentAssets).toEqual([
                    'main.js',
                ]);

                expect(await sandbox.getFileList(outputPathFull)).toEqual([
                    'main.js',
                    'static1.js',
                    'static2.txt',
                ]);
            });
        }
    });
});
