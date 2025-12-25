# Clean Bin Obj - .NET Build Cleaner & Rebuild Tool

[![Version](https://img.shields.io/visual-studio-marketplace/v/hybr8.clean-bin-obj?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=hybr8.clean-bin-obj)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/hybr8.clean-bin-obj?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=hybr8.clean-bin-obj)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/hybr8.clean-bin-obj?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=hybr8.clean-bin-obj)
[![License](https://img.shields.io/github/license/trantung95/CleanBinAndObj?style=flat-square)](https://github.com/trantung95/CleanBinAndObj/blob/master/LICENSE)

**The ultimate Visual Studio Code extension for .NET developers!** Instantly clean `bin` and `obj` folders, remove build artifacts, delete temporary files, and rebuild your C#, F#, and VB.NET projects with a single command. Save disk space and fix build issues fast!

## 🚀 Why Choose This Extension?

Perfect for **.NET Core**, **.NET Framework**, **ASP.NET**, and **Xamarin** developers who need to:
- 🧹 **Clean build artifacts** from bin and obj folders instantly
- 🔄 **Rebuild projects** automatically after cleaning
- 💾 **Free up disk space** by removing gigabytes of temporary build files
- 🐛 **Fix build errors** caused by corrupted cache
- 🔀 **Switch Git branches** cleanly without build conflicts
- ⚡ **Boost productivity** with one-click workspace cleanup

## 🎯 Features

- 🧹 **Instant Cleanup** - Delete all bin and obj folders with one command
- 🔄 **Smart Rebuild** - Automatically rebuild .NET projects after cleaning  
- 🎯 **Multi-Project Support** - Clean entire workspace or single project
- 🔍 **Auto-Detection** - Finds .csproj, .fsproj, .vbproj, and .sln files automatically
- ⚙️ **Fully Configurable** - Customize target directories and patterns
- 📊 **Real-time Progress** - Visual progress tracking with detailed output logs
- 💪 **Production Ready** - Battle-tested with large .NET solutions
- 🚀 **Lightning Fast** - Optimized for performance on big codebases

### Supported Project Types
✅ C# Projects (.csproj)  
✅ F# Projects (.fsproj)  
✅ VB.NET Projects (.vbproj)  
✅ Solution Files (.sln)  
✅ .NET Core / .NET 5+ / .NET 6/7/8  
✅ .NET Framework 4.x  
✅ ASP.NET Core / ASP.NET MVC  
✅ Xamarin / MAUI Projects

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

## ❓ Why Use This Extension?

### Common Problems This Extension Solves:

**💾 Disk Space Issues**
- Bin and obj folders accumulate gigabytes of build artifacts
- Each .NET project can consume 100+ MB in temporary files
- Large solutions can waste several GB of disk space

**🐛 Build Errors**
- "Type already defines a member" errors
- Corrupted cache causing mysterious build failures  
- IntelliSense showing outdated or incorrect suggestions
- Assembly conflicts and version mismatches

**🔀 Git Branch Problems**
- Build artifacts causing merge conflicts
- Switching branches leaves orphaned binaries
- .gitignore misses some generated files

**⚡ Performance Issues**
- Slow build times due to cached dependencies
- File indexing taking too long
- Visual Studio Code consuming high memory

**🎯 Solution: One-Click Cleanup**
This extension makes it effortless to clean all build artifacts across your entire workspace or specific projects, with optional automatic rebuild to ensure everything compiles correctly after cleanup.

## Requirements

- Visual Studio Code 1.75.0 or higher
- .NET SDK (optional, required only for rebuild functionality)

## 📦 Installation

**Method 1: VS Code Marketplace (Recommended)**
1. Open Visual Studio Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for "**Clean Bin Obj**" or "**CleanBinAndObj**"
4. Click **Install**

**Method 2: Command Line**
```bash
code --install-extension hybr8.clean-bin-obj
```

**Method 3: Manual Installation**
Download the `.vsix` file from [GitHub Releases](https://github.com/trantung95/CleanBinAndObj/releases)

## Known Issues

None at this time. Please report issues on the [GitHub repository](https://github.com/trantung95/CleanBinAndObj/issues).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request on [GitHub](https://github.com/trantung95/CleanBinAndObj).

## License

This extension is licensed under the [Apache-2.0 License](LICENSE).

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
