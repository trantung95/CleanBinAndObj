# Change Log

All notable changes to the "clean-bin-obj" extension will be documented in this file.

## [1.9.2] - 2025-12-26

### Changed
- Updated documentation to explicitly mention .NET 9/10+ support
- Clarified that extension is future-proof - automatically supports new .NET versions
- Extension works with any .NET version because it:
  - Uses project files (.csproj, .fsproj, .vbproj) - format unchanged across versions
  - Uses `dotnet build` CLI - automatically detects version from project
  - Only cleans bin/obj folders - framework-agnostic operation

## [1.9.1] - 2025-12-26

### Changed
- **Reverted**: Output panel now always shows during operations (v1.9.0 made it optional)
- Rationale: Output panel provides transparency and real-time feedback - essential for good UX
- Panel is small and non-intrusive, shows progress which helps user confidence
- Users can see what's happening in real-time instead of just waiting

## [1.9.0] - 2025-12-26

### UX Improvements 🎨

#### Fixed Major UX Issues:
1. **✅ No More Intrusive Output Channel** - Output channel no longer auto-shows and interrupts your workflow
   - Only shows automatically if `showOutputChannel` config is enabled
   - On errors, shows "View Output" button instead of forcing panel open

2. **✅ Reduced Log Spam** - Search logging now only logs every 10 levels instead of every directory
   - Cleaner output channel
   - Easier to find important information

3. **✅ Actionable Error Messages** - All errors now have action buttons:
   - "No file open" → Shows "Open File" button
   - "No project found" → Shows "View Output" button  
   - ".NET SDK not found" → Shows "Download .NET SDK" button (opens download page)
   - "Rebuild failed" → Shows "View Output" button

4. **✅ Better Progress Messages** - Now shows: `Cleaning MyProject.Web (3/10)` 
   - Previously: `3/10: bin` (unclear!)

5. **✅ Completion Summaries** - Smart notifications after operations:
   - Success: `✅ Successfully cleaned 5 project(s) in 1.23s. 10 folders removed.`
   - Errors: Shows warning with "View Output" button
   - Rebuild: Shows time taken: `✅ Rebuild completed successfully in 45.6s`

### Changed
- Output channel respects `showOutputChannel` config for all operations
- Error messages are more descriptive and actionable
- Progress notifications show project names instead of folder names
- Success messages include elapsed time and counts

## [1.8.0] - 2025-12-26

### Added
- ✨ **Relative Path Support** - Now supports nested paths like `bin/Debug`, `packages/lib`
- **More Flexible Configuration** - Clean specific subdirectories with relative paths
- **Whitespace Trimming** - Automatically trims whitespace from config values

### Changed
- **Relaxed Validation** - Previous validation was too strict and rejected valid relative paths
- Validation now allows: `"bin"`, `"obj"`, `"bin/Debug"`, `"bin\Release"`, `"packages/nuget"`
- Still blocks dangerous patterns: `".."`, absolute paths like `"C:\temp"`

### Fixed
- **Critical**: Fixed overly strict validation that rejected `bin/Debug` and similar valid paths
- User can now configure nested directories for more precise cleaning
- Trailing slashes in config now handled correctly

### Security
- ✅ Still prevents path traversal attacks (`..`)
- ✅ Still prevents absolute path injection
- ✅ Validates normalized paths don't escape project directory

## [1.7.1] - 2025-12-26

### Changed
- Improved error message clarity for invalid target directories
- Error now explicitly states examples of allowed values ('bin', 'obj')

### Verified
- ✅ All validation logic working correctly for common use cases
- ✅ Default config ['bin', 'obj'] passes all validations
- ✅ Security checks properly reject dangerous paths
- ✅ No bugs introduced in previous fixes

## [1.7.0] - 2025-12-26

### Added
- **Input Validation** - Validates rootPaths parameter to prevent crashes from invalid input
- **Stack Trace Logging** - Error logs now include full stack traces for better debugging
- **Platform-Specific Process Kill** - Uses SIGKILL on Windows, SIGTERM on Unix for reliable termination
- **Empty Array Protection** - Validates targetSubdirectories is not empty before processing

### Fixed
- **Critical**: Removed duplicate require('child_process') - was declared twice in rebuildProjects
- **Critical**: Fixed race condition in fs.existsSync - now handled atomically by rmSync
- **Critical**: Fixed process kill signal - properly terminates on Windows with SIGKILL
- **High**: Added null check for buildProcess before kill to prevent race condition
- **High**: Validates projectDirs is not empty before cleaning
- **Medium**: deleteDirectoryRecursive now returns boolean indicating if directory existed
- **Medium**: Error handling now includes stack traces for debugging
- **Low**: Fixed unused execPromise variable declaration

### Changed
- deleteDirectoryRecursive signature changed to return Promise<boolean>
- Process termination wrapped in try-catch to handle kill errors gracefully
- All catch blocks now log stack traces when available
- Directory existence check removed - deletion now handled atomically

## [1.6.0] - 2025-12-26

### Added
- **Process Termination** - Build process now properly killed when user cancels operation
- **Symlink Protection in Recursive Search** - Prevents infinite loops from circular symlinks
- **Config Type Validation** - Validates that targetSubdirectories is an array of strings

### Fixed
- **Critical**: Fixed Promise.race memory leak - timeout now properly cleared after build completes
- **Critical**: Build process now terminates when user cancels (previously kept running)
- **Critical**: Added type validation for config - prevents crash if user sets wrong type
- **High**: Fixed symlink infinite loop in findProjectFilesRecursive using visited Set
- **Medium**: Removed unused projectPatterns config variable
- **Medium**: Validates each array element is a string before processing

### Changed
- Build cancellation now kills the actual dotnet process, not just the Promise
- Timeout ID tracked and cleared in all code paths (success, error, cancel)
- findProjectFilesRecursive now tracks visited directories to prevent symlink loops
- Better config validation with helpful error messages

## [1.5.0] - 2025-12-26

### Added
- **Timeout Protection** - Rebuild operations now have 15-minute timeout to prevent indefinite hanging
- **Circular Reference Detection** - Prevents infinite loops from symbolic links during project search
- **Retry Logic** - Directory deletion now retries up to 3 times with 100ms delay

### Fixed
- **Critical**: Improved path validation to detect mixed path separators (e.g., `bin/obj\test`)
- **Critical**: Added circular directory reference detection using visited directories tracking
- **High**: Made rebuild operation cancellable by user (was non-cancellable)
- **High**: Added 15-minute timeout for rebuild operations
- **Medium**: Added maxBuffer (10MB) for build output to prevent memory issues
- **Medium**: Improved error handling - errors no longer silently swallowed in directory deletion
- **Medium**: Added maxDepth validation (capped at 100) to prevent stack overflow
- **Low**: Removed unused cleanDirectory function (dead code cleanup)

### Changed
- Path normalization now validates against any path separator after normalization
- Rebuild progress indicator now shows as cancellable
- Directory deletion failures now throw detailed error context instead of silent failure
- findProjectFileInPath now uses Set to track visited directories

## [1.4.0] - 2025-12-26

### Added
- **Cancellation Support** - Users can now cancel long-running clean operations
- **Concurrent Operation Lock** - Prevents multiple clean operations running simultaneously
- **Path Traversal Protection** - Validates config to prevent accidental deletion of parent folders
- **Better Error Messages** - Shows specific error codes (EBUSY, EPERM) with helpful context

### Fixed
- **Memory Leak** - OutputChannel now properly disposed on extension deactivate
- Fixed race condition when spamming clean commands
- Better error logging with error codes and context
- Improved error handling for locked/in-use files

### Improved
- More robust permission error handling
- Better user feedback for file-in-use scenarios
- Safer configuration validation
- Enhanced stability and reliability

## [1.3.0] - 2025-12-26

### Fixed
- **CRITICAL**: Fixed rebuild logic bug - rebuild now correctly uses cleaned project file
- **CRITICAL**: Fixed workspace rebuild to find and build .sln files instead of just folders
- Fixed rebuild current project not working if file was closed after clean
- Added .NET SDK detection before attempting rebuild

### Improved
- Better rebuild logic with proper project file passing
- Workspace rebuild now searches for .sln files for proper builds
- Reduced scan depth from 100 to 20 levels for better performance
- Added dotnet CLI availability check before rebuild
- More reliable rebuild workflow

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
