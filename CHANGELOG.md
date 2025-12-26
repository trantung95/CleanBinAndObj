# Change Log

All notable changes to the "clean-bin-obj" extension will be documented in this file.

## [1.1.4] - 2025-12-26

### Added
- **Context Menu (Right-Click) Support** - Clean projects directly from Explorer and Editor
- Right-click menu in File Explorer for quick access
- Right-click menu in Code Editor for quick access
- Enhanced README with 3 usage methods and examples
- Better keyword variations for improved searchability (cleanobj, binclean, etc.)

### Improved
- More intuitive user experience with multiple access points
- Comprehensive usage documentation with practical examples
- SEO optimization with 43+ keywords and tags

## [1.1.0] - 2025-12-25

### Added
- **Clean and Rebuild** functionality - Automatically rebuild projects after cleaning
- New commands:
  - `Clean, Rebuild Entire Workspace` - Clean all projects and rebuild
  - `Clean, Rebuild Current Project` - Clean current project and rebuild
- Enhanced quick pick menu with 4 options (added rebuild variants)
- Added "rebuild" keyword for better discoverability
- Integration with `dotnet build` command for rebuilding

### Improved
- Better project detection using filesystem instead of VS Code API
- Improved folder deletion with `fs.rmSync()` for reliability
- Enhanced error handling during clean and rebuild operations
- More detailed build output in the output channel

### Changed
- Quick pick menu now shows 4 options instead of 2
- Updated README with new rebuild features

## [1.0.2] - 2025-12-25

### Added
- Improved discoverability with additional keywords (cleanbinandbj, c#, .net, etc.)
- Enhanced description for marketplace

## [1.0.1] - 2025-12-25

### Added
- Homepage and bugs tracker links
- Gallery banner for marketplace

## [1.0.0] - 2025-12-25

### Added
- Initial release
- Clean bin and obj folders in workspace
- Context menu integration for folder cleaning
- Command palette commands:
  - `Clean Bin and Obj Folders`
  - `Clean Bin and Obj in Entire Workspace`
- Configuration options:
  - `cleanBinObj.targetSubdirectories` - Subdirectories to clean
  - `cleanBinObj.projectPatterns` - Patterns to identify project files
  - `cleanBinObj.showOutputChannel` - Toggle output channel visibility
- Progress tracking with notifications
- Detailed output logging with timestamps
- Support for multiple .NET project types (.csproj, .fsproj, .vbproj, .sln)

### Features
- Smart project detection across workspace
- Recursive directory cleaning
- Error handling and reporting
- Real-time progress updates
- Statistics on cleaned items

---

## Future Enhancements

Planned features for future releases:
- Custom directory patterns support
- Exclude patterns configuration
- Dry-run mode (preview before deleting)
- Multi-workspace support
- Configurable keyboard shortcuts
