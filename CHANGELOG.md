# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

### Fixed

-   Removed `yarn` from `package.json` `engines`

## [2.0.2] - 2018-07-24

### Changed

-   Sort `currentAssets` array
-   Use codecov and submit all webpack versions for coverage
-   Internal: Use [`backtrack`](https://github.com/chrisblossom/backtrack) to manage build environment

## [2.0.1] - 2018-03-21

### Added

-   Add coveralls

### Changed

-   Package updates

## [2.0.0] - 2018-03-19

### Removed

-   Support for node v4

## [1.1.1] - 2018-03-19

### Fixed

-   Fix Windows Tests

### Changed

-   Project optimizations
-   Package updates

## [1.1.0] - 2018-02-26

### Added

-   Support Webpack v4

### Changed

-   Package updates
-   Jest config updates
-   lint-staged fix

## [1.0.5] - 2017-12-07

### Fixed

-   Handle webpack errors - run only on successful webpack compilation

### Changed

-   Package updates

## [1.0.4] - 2017-10-13

### Changed

-   Use prettierrc.js
-   Do not save-exact dependencies
-   Fix npm prepublishOnly (does not work with Yarn)

## [1.0.3] - 2017-07-04

### Changed

-   Webpack v1 officially unsupported
-   package.json peerDependencies
-   Package dependency updates
-   Testing optimizations

## [1.0.2] - 2017-06-21

### Fixed

-   customPatterns: ensure pattern removal after every build. [7772948a](https://github.com/chrisblossom/clean-self-webpack-plugin/commit/7772948a488ddedadff815c926a70ef18e84fb3d)

### Added

-   More tests
