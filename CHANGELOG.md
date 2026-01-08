# Change Log

All notable changes to the "clean-bin-obj" extension will be documented in this file.

## [2.0.5] - 2026-01-08

### Fixed
- **Build Progress Counter Not Showing** - Fixed issue where build phase counter wasn't incrementing
  - Problem: Restore counter worked (1/5, 2/5...) but build counter stayed at same number
  - Root cause: Both restore and build phases were using the same counter variable
  - Solution: Separate counters for restore and build phases
  - Now shows: `Restoring (1/5)` → `Restoring (2/5)` → ... → `Building (1/5)` → `Building (2/5)` → ...

### Changed
- Added phase tracking to distinguish between restore and build operations
- Build counter resets to 0 when restore phase completes
- Each phase now has its own independent counter for accurate progress tracking

## [2.0.4] - 2026-01-08

### Fixed
- **Project Name Extraction** - Fixed regex that was stripping dots from project names
  - Before: "Cartrack.CommsEngine.Identity" → displayed as "Identity"
  - After: "Cartrack.CommsEngine.Identity" → displays full name (or truncated with "..." if > 30 chars)
- **Counter Always Shows** - Now shows counter even when total project count is unknown
  - Shows as "Restoring (2) ProjectName" if total unknown
  - Shows as "Restoring (2/5) ProjectName" if total is known
- **Three Dots Logic** - Truncation with "..." only happens if project name > 30 characters
  - Short names: "MyApp" → displays as-is
  - Long names: "VeryLongProjectNameThatExceeds30Characters" → "...Exceeds30Characters"

### Clarified
- **Warning Icon ⚠️ xUnit1051**: This shows build warning codes as they occur during compilation
  - xUnit1051 is a specific xUnit test framework warning
  - Format: ⚠️ followed by the warning code (CS0168, xUnit1051, etc.)
  - Helps you see warnings immediately without opening Output panel

## [2.0.3] - 2026-01-08

### Fixed
- **Progress Detection Not Working** - Fixed regex patterns not matching dotnet build output properly
  - Counter (X/Y) now shows correctly during restore and build
  - Project name truncation with "..." now works properly
  - Made regex patterns more flexible to handle different output formats
  - Added trimming of whitespace before matching to improve detection
  - Fixed "Restored" detection to catch multiple variants ("Restored", "restore completed", "All projects are up-to-date")

### Added
- Debug logging to Output Channel showing detected projects and progress (helps troubleshooting)
- Better handling of edge cases in dotnet build output parsing

### Changed
- Improved project name extraction from build output (now removes spaces more reliably)
- Skip empty lines during output parsing for better performance

## [2.0.2] - 2026-01-08

### Fixed
- **Critical: Cancellation Bug** - Fixed issue where clicking cancel button during rebuild would lock the extension
  - Previously: After cancelling, extension showed "Another clean/rebuild operation is already in progress" and couldn't run new operations
  - Now: Cancellation properly cleans up the operation state, allowing immediate retry
  - Build process is now properly terminated when cancelled
  - Added explicit process kill on cancellation to ensure cleanup

### Changed
- Improved cancellation handling to ensure operation lock (`isOperationInProgress`) is always released
- Better logging for cancelled operations to distinguish user cancellation from errors

## [2.0.1] - 2026-01-07

### Changed
- **Counter Format Improved**: Changed progress display format for better readability:
  - Restore: `Restoring (1/5) ProjectName` (was `1/5 Restoring ProjectName...`)
  - Build: `Building (2/5) ProjectName` (was `2/5 Building ProjectName...`)
- Counter now appears in parentheses after the action verb for more natural reading
- Removed trailing "..." for cleaner appearance
- Project name truncation still active for long names (shows "...ProjectName" if >30 chars)

## [2.0.0] - 2026-01-07

### Added
- ✨ **Real-time Build Progress in Popup** - Now shows live build progress in notification:
  - `Restoring packages (N projects)...` → Shows total project count during restore
  - `X/Y Restoring ProjectName...` → Shows current project being restored with counter
  - `Packages restored ✓` → Confirmation of restore completion
  - `Compiling...` → During compilation phase
  - `X/Y Building ProjectName...` → Shows which project is being built with counter
  - `⚠️ Warning` → Shows warning codes as they occur
  - `❌ Error` → Shows error codes immediately
  - `✅ Build succeeded` → Success indicator
- **Project Counter**: Automatically detects total project count and shows progress (e.g., "2/5 Building MyApp...")
- **Project Name Display**: Shows individual project names during restore and build phases
- **Smart Truncation**: Long project names (>30 chars) are truncated with "..." prefix to prevent layout breaking

### Changed
- **Major**: Switched from `exec` to `spawn` for real-time output streaming
- Build output now appears in Output Channel in real-time (not buffered)
- Progress notification updates dynamically instead of static "Rebuilding..."
- Better visibility into what's happening during long builds
- Counter prefix format changed from "(X/Y)" suffix to "X/Y" prefix for better readability

### Improved
- Users can see exactly which project is being built/restored without opening Output panel
- Progress tracking shows current project number out of total for multi-project solutions
- Warnings and errors appear in popup immediately when they occur
- Much better UX for multi-project solutions with long build times
- Notification layout remains stable even with very long project names

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
