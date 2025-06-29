# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]



### Added
- Initial release of Diffract - A modern web-based diff checker and viewer
- Text diff comparison functionality with side-by-side and unified views
- File diff parsing and visualization
- Dark/light theme support
- Responsive design with modern UI components
- Line-by-line diff highlighting
- Hunk-based diff display for better readability
- Virtual scrolling for large diff files
- Copy to clipboard functionality
- Export diff results
- Rich markdown diff view with toggle between code and rendered markdown
- Large file handling with 'See difference' option for improved performance

### Changed
- Improved diff parsing algorithm for better accuracy
- Enhanced UI/UX with Tailwind CSS styling
- Optimized performance for large file comparisons
- Increased large file threshold to 400 lines for better performance balance

### Fixed
- File parsing edge cases
- UI responsiveness on mobile devices
- Theme switching persistence
- Rename detection bug that incorrectly marked all files as renamed
- Diff header parsing for better metadata display across all file types

## [0.1.0] - 2025-6-29
[Unreleased]: https://github.com/jezzWTF/diff/compare/v0.1.1...HEAD
[0.1.0]: https://github.com/jezzWTF/diff/releases/tag/v0.1.0 
