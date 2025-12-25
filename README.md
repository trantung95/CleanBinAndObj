# Clean Bin and Obj

A Visual Studio Code extension for easily cleaning all `bin` and `obj` directories in your workspace. Perfect for .NET developers who want to quickly clean build artifacts and rebuild projects.

## Features

- 🧹 **Clean Bin and Obj folders** in your workspace with a single command
- 🔄 **Clean and Rebuild** - Clean build artifacts and automatically rebuild projects
- 🎯 **Smart project detection** - Automatically finds .NET projects (.csproj, .fsproj, .vbproj, .sln)
- ⚡ **Multiple options** - Clean entire workspace or just the current project
- ⚙️ **Configurable** - Customize which subdirectories to clean
- 📊 **Progress tracking** - See real-time progress and detailed output

## Usage

### Quick Access

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type `Clean Bin and Obj`
3. Choose from available options:
   - **Clean Entire Workspace** - Remove bin/obj from all projects
   - **Clean Current Project** - Remove bin/obj from current file's project
   - **Clean & Rebuild Entire Workspace** - Clean and rebuild all projects
   - **Clean & Rebuild Current Project** - Clean and rebuild current project

### Direct Commands

- **Clean Bin and Obj in Entire Workspace** - Clean all projects immediately
- **Clean Bin and Obj in Current Project** - Clean current project immediately  
- **Clean, Rebuild Entire Workspace** - Clean and rebuild all projects
- **Clean, Rebuild Current Project** - Clean and rebuild current project

### Keyboard Shortcut

You can assign a custom keyboard shortcut:
1. Open Keyboard Shortcuts (`Ctrl+K Ctrl+S` or `Cmd+K Cmd+S`)
2. Search for `Clean Bin and Obj`
3. Assign your preferred shortcut

## Configuration

Configure the extension through VS Code settings:

```json
{
  // Subdirectories to clean in project folders
  "cleanBinObj.targetSubdirectories": ["bin", "obj"],
  
  // Glob patterns to identify project files
  "cleanBinObj.projectPatterns": [
    "**/*.csproj",
    "**/*.fsproj",
    "**/*.vbproj",
    "**/*.sln"
  ],
  
  // Show output channel when cleaning
  "cleanBinObj.showOutputChannel": true
}
```

### Settings Details

- **`cleanBinObj.targetSubdirectories`**: Array of subdirectory names to clean (default: `["bin", "obj"]`)
- **`cleanBinObj.projectPatterns`**: Glob patterns to identify project files (default: .NET project files)
- **`cleanBinObj.showOutputChannel`**: Show the output channel with detailed logs (default: `true`)

## Example Output

```
[14:23:45.123] Starting cleanup...
[14:23:45.124] Target subdirectories: bin, obj
[14:23:45.125] Found 5 project file(s)
[14:23:45.126] Projects to clean: 5
[14:23:45.127] Cleaning: d:\Projects\MyApp\MyApp.Web
[14:23:45.128]   - Cleaned bin: 45 files, 12 directories
[14:23:45.129]   - Cleaned obj: 23 files, 8 directories
[14:23:45.130] Cleaning: d:\Projects\MyApp\MyApp.Core
[14:23:45.131]   - Cleaned bin: 32 files, 10 directories
[14:23:45.132]   - Cleaned obj: 18 files, 6 directories
[14:23:45.356] Finished. Elapsed: 0.23s
[14:23:45.357] Total items cleaned: 154, Errors: 0
```

## Why Use This Extension?

When working with .NET projects, `bin` and `obj` folders can:
- Accumulate gigabytes of build artifacts
- Cause issues with version control
- Create problems when switching branches
- Interfere with clean builds

This extension makes it easy to clean these folders across your entire workspace with a single command.

## Requirements

- Visual Studio Code 1.75.0 or higher
- No additional dependencies required

## Known Issues

None at this time. Please report issues on the [GitHub repository](https://github.com/your-repo/clean-bin-obj).

## Release Notes

### 1.0.0

Initial release:
- Clean bin and obj folders in workspace
- Context menu integration
- Configurable target directories
- Progress tracking and detailed output

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Apache 2.0](LICENSE)

## Credits

Inspired by the [Clean Bin and Obj](https://marketplace.visualstudio.com/items?itemName=dobrynin.cleanbinandobj) extension for Visual Studio.

---

**Enjoy cleaning! 🧹**
