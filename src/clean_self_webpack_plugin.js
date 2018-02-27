import path from 'path';
import del from 'del';

class CleanSelfWebpackPlugin {
    constructor(options = {}) {
        this.options = {
            /**
             * Simulate the removal of files
             */
            dryRun: options.dryRun || false,

            /**
             * console.warn removed files
             */
            verbose: options.dryRun || options.verbose || false,

            /**
             * Custom pattern matching
             *
             * See https://github.com/sindresorhus/del#patterns
             */
            customPatterns: options.customPatterns || [],

            /**
             * Remove files once prior to compilation
             *
             * See https://github.com/sindresorhus/del#patterns
             */
            initialPatterns: options.initialPatterns || [],
        };

        /**
         * Store webpack build assets
         */
        this.currentAssets = [];

        /**
         * Only used with initialPatterns
         */
        this.initialClean = false;

        this.handleInitial = this.handleInitial.bind(this);
        this.handleDone = this.handleDone.bind(this);
        this.removeFiles = this.removeFiles.bind(this);
    }

    apply(compiler) {
        const outputPath = compiler.options.output.path;

        /**
         * webpack 4+ comes with a new plugin system.
         *
         * Check for hooks in-order to support old plugin system
         */
        const hooks = compiler.hooks;

        if (this.options.initialPatterns.length !== 0) {
            if (hooks) {
                hooks.compile.tap('clean-self-webpack-plugin', () => {
                    this.handleInitial({ outputPath });
                });
            } else {
                compiler.plugin('compile', () => {
                    this.handleInitial({ outputPath });
                });
            }
        }

        if (hooks) {
            hooks.done.tap('clean-self-webpack-plugin', (stats) => {
                this.handleDone({ stats, outputPath });
            });
        } else {
            compiler.plugin('done', (stats) => {
                this.handleDone({ stats, outputPath });
            });
        }
    }

    /**
     * Initially remove files from output directory prior to build.
     *
     * Only happens once.
     *
     * Warning: It is highly recommended to clean your build directory outside of webpack to minimize unexpected behavior.
     */
    handleInitial({ outputPath }) {
        if (this.initialClean) {
            return;
        }

        this.initialClean = true;

        this.removeFiles({
            outputPath,
            patterns: [
                ...this.options.initialPatterns,
                ...this.options.customPatterns,
            ],
        });
    }

    handleDone({ stats, outputPath }) {
        /**
         * Do nothing if there is a webpack error
         */
        if (stats.hasErrors()) {
            if (this.options.verbose) {
                // eslint-disable-next-line no-console
                console.warn(
                    `clean-self-webpack-plugin: pausing due to webpack errors`,
                );
            }

            return;
        }

        /**
         * Fetch Webpack's output asset files
         */
        const assets = stats.toJson().assets.map((asset) => {
            return asset.name;
        });

        /**
         * Get all files that were in the previous build but not the current
         *
         * (relies on del's cwd: outputPath option)
         */
        const staleFiles = this.currentAssets.filter((previousAsset) => {
            // .includes is not supported without a polyfill
            return assets.indexOf(previousAsset) === -1;
        });

        /**
         * Save assets for next compilation
         */
        this.currentAssets = assets;

        /**
         * Do nothing if there aren't any files to delete and customPatterns is not defined
         */
        if (
            staleFiles.length === 0 &&
            this.options.customPatterns.length === 0
        ) {
            return;
        }

        /**
         * Merge customPatters with stale files.
         */
        this.removeFiles({
            outputPath,
            patterns: [...staleFiles, ...this.options.customPatterns],
        });
    }

    removeFiles({ outputPath, patterns }) {
        const deleted = del.sync(patterns, {
            // Change context to build directory
            cwd: outputPath,
            dryRun: this.options.dryRun,
        });

        /**
         * Log if verbose is enabled
         */
        if (this.options.verbose) {
            deleted.forEach((file) => {
                const filename = path.parse(file).base;

                const message = this.options.dryRun ? 'dryRun' : 'removed';

                /**
                 * Use console.warn over .log
                 * https://github.com/webpack/webpack/issues/1904
                 * https://github.com/johnagan/clean-webpack-plugin/issues/11
                 */
                // eslint-disable-next-line no-console
                console.warn(
                    `clean-self-webpack-plugin: ${message} ${filename}`,
                );
            });
        }
    }
}

/**
 * Use module.exports so we don't have to worry about require().default
 */
module.exports = CleanSelfWebpackPlugin;
