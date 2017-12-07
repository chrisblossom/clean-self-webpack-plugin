# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [1.0.5] - 2017-12-07
- handle webpack errors - run only on successful webpack compilation
- package updates

## [1.0.4] - 2017-10-13
- use prettierrc.js
- do not save-exact dependencies
- fix npm prepublishOnly (does not work with Yarn)

## [1.0.3] - 2017-07-04
- Webpack v1 officially unsupported
- package.json peerDependencies 
- package dependency updates
- testing optimizations

## [1.0.2] - 2017-06-21

### Fixed
- customPatterns: ensure pattern removal after every build. [7772948a](https://github.com/chrisblossom/clean-self-webpack-plugin/commit/7772948a488ddedadff815c926a70ef18e84fb3d)

### Added
- more tests
