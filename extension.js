const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('Clean Bin and Obj');

    // Command to show options and clean
    let cleanCommand = vscode.commands.registerCommand('cleanBinObj.clean', async () => {
        const options = [
            'Clean Entire Workspace',
            'Clean Current Project',
            'Clean & Rebuild Entire Workspace',
            'Clean & Rebuild Current Project'
        ];
        
        const choice = await vscode.window.showQuickPick(options, {
            placeHolder: 'Choose what to clean'
        });

        if (!choice) {
            return; // User cancelled
        }

        if (choice === 'Clean Entire Workspace') {
            await cleanWorkspace(outputChannel);
        } else if (choice === 'Clean Current Project') {
            await cleanCurrentProject(outputChannel);
        } else if (choice === 'Clean & Rebuild Entire Workspace') {
            await cleanAndRebuildWorkspace(outputChannel);
        } else if (choice === 'Clean & Rebuild Current Project') {
            await cleanAndRebuildCurrentProject(outputChannel);
        }
    });

    // Command to clean entire workspace directly
    let cleanWorkspaceCommand = vscode.commands.registerCommand('cleanBinObj.cleanWorkspace', async () => {
        await cleanWorkspace(outputChannel);
    });

    // Command to clean current project directly
    let cleanCurrentProjectCommand = vscode.commands.registerCommand('cleanBinObj.cleanCurrentProject', async () => {
        await cleanCurrentProject(outputChannel);
    });

    // Command to clean and rebuild workspace
    let cleanAndRebuildWorkspaceCommand = vscode.commands.registerCommand('cleanBinObj.cleanAndRebuildWorkspace', async () => {
        await cleanAndRebuildWorkspace(outputChannel);
    });

    // Command to clean and rebuild current project
    let cleanAndRebuildCurrentProjectCommand = vscode.commands.registerCommand('cleanBinObj.cleanAndRebuildCurrentProject', async () => {
        await cleanAndRebuildCurrentProject(outputChannel);
    });

    context.subscriptions.push(cleanCommand);
    context.subscriptions.push(cleanWorkspaceCommand);
    context.subscriptions.push(cleanCurrentProjectCommand);
    context.subscriptions.push(cleanAndRebuildWorkspaceCommand);
    context.subscriptions.push(cleanAndRebuildCurrentProjectCommand);
}

/**
 * Clean entire workspace
 */
async function cleanWorkspace(outputChannel) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder opened');
        return;
    }

    const workspacePaths = vscode.workspace.workspaceFolders.map(folder => folder.uri.fsPath);
    await cleanBinAndObj(workspacePaths, outputChannel);
}

/**
 * Clean current project (find project containing current file)
 */
async function cleanCurrentProject(outputChannel) {
    const activeEditor = vscode.window.activeTextEditor;
    
    if (!activeEditor) {
        vscode.window.showErrorMessage('No file is currently open');
        return null;
    }

    const currentFilePath = activeEditor.document.uri.fsPath;
    const currentDir = path.dirname(currentFilePath);
    
    outputChannel.clear();
    outputChannel.show(true);
    outputChannel.appendLine(`[${getTimestamp()}] Finding project for: ${currentFilePath}`);
    
    // Search for project file in current directory and parent directories
    const projectFile = findProjectFileInPath(currentDir, outputChannel);
    
    if (!projectFile) {
        vscode.window.showErrorMessage('No project file found for current file');
        outputChannel.appendLine(`[${getTimestamp()}] No .csproj, .fsproj, .vbproj, or .sln found`);
        return null;
    }
    
    const projectDir = path.dirname(projectFile);
    outputChannel.appendLine(`[${getTimestamp()}] Found project: ${projectFile}`);
    
    await cleanBinAndObj([projectDir], outputChannel);
    return projectFile; // Return projectFile for rebuild
}

/**
 * Find project file by searching up the directory tree
 */
function findProjectFileInPath(startDir, outputChannel) {
    const extensions = ['.csproj', '.fsproj', '.vbproj', '.sln'];
    let currentDir = startDir;
    const maxLevelsUp = 100;
    
    for (let i = 0; i < maxLevelsUp; i++) {
        outputChannel.appendLine(`[${getTimestamp()}] Searching in: ${currentDir}`);
        
        try {
            const files = fs.readdirSync(currentDir);
            
            for (const file of files) {
                const ext = path.extname(file).toLowerCase();
                if (extensions.includes(ext)) {
                    return path.join(currentDir, file);
                }
            }
            
            // Move up one directory
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                break; // Reached root
            }
            currentDir = parentDir;
        } catch (error) {
            outputChannel.appendLine(`[${getTimestamp()}] Error accessing: ${currentDir}`);
            break;
        }
    }
    
    return null;
}

/**
 * Clean bin and obj directories
 * @param {string[]} rootPaths - Root paths to search for projects
 * @param {vscode.OutputChannel} outputChannel - Output channel for logging
 */
async function cleanBinAndObj(rootPaths, outputChannel) {
    const config = vscode.workspace.getConfiguration('cleanBinObj');
    const targetSubdirectories = config.get('targetSubdirectories', ['bin', 'obj']);
    const projectPatterns = config.get('projectPatterns', ['**/*.csproj', '**/*.fsproj', '**/*.vbproj', '**/*.sln']);
    const showOutput = config.get('showOutputChannel', true);

    if (showOutput) {
        outputChannel.clear();
        outputChannel.show(true);
    }

    const startTime = Date.now();
    outputChannel.appendLine(`[${getTimestamp()}] Starting cleanup...`);
    outputChannel.appendLine(`[${getTimestamp()}] Searching in: ${rootPaths.join(', ')}`);
    outputChannel.appendLine(`Target subdirectories: ${targetSubdirectories.join(', ')}`);

    try {
        // Find all project files
        const projectFiles = [];
        const extensions = ['.csproj', '.fsproj', '.vbproj', '.sln'];
        
        for (const rootPath of rootPaths) {
            if (!fs.existsSync(rootPath)) {
                outputChannel.appendLine(`[${getTimestamp()}] Path not found: ${rootPath}`);
                continue;
            }
            
            outputChannel.appendLine(`[${getTimestamp()}] Searching for projects in: ${rootPath}`);
            const foundFiles = findProjectFilesRecursive(rootPath, extensions, outputChannel);
            outputChannel.appendLine(`[${getTimestamp()}] Found ${foundFiles.length} project file(s) in this path`);
            projectFiles.push(...foundFiles);
        }

        if (projectFiles.length === 0) {
            outputChannel.appendLine(`[${getTimestamp()}] No project files found`);
            vscode.window.showInformationMessage('No project files found in selected path');
            return;
        }

        outputChannel.appendLine(`[${getTimestamp()}] Found ${projectFiles.length} project file(s)`);

        // Get unique project directories
        const projectDirs = [...new Set(projectFiles.map(file => path.dirname(file)))];
        outputChannel.appendLine(`[${getTimestamp()}] Projects to clean: ${projectDirs.length}`);

        let totalCleaned = 0;
        let totalErrors = 0;

        // Progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Cleaning bin and obj folders",
            cancellable: false
        }, async (progress) => {
            for (let i = 0; i < projectDirs.length; i++) {
                const projectDir = projectDirs[i];
                const projectName = path.basename(projectDir);
                
                progress.report({ 
                    increment: (100 / projectDirs.length),
                    message: `${i + 1}/${projectDirs.length}: ${projectName}`
                });

                outputChannel.appendLine(`[${getTimestamp()}] Cleaning: ${projectDir}`);

                for (const subdir of targetSubdirectories) {
                    const dirToClean = path.join(projectDir, subdir);
                    
                    if (fs.existsSync(dirToClean)) {
                        try {
                            // Delete entire folder including the folder itself
                            await deleteDirectoryRecursive(dirToClean);
                            totalCleaned++;
                            outputChannel.appendLine(`[${getTimestamp()}]   - Deleted folder: ${subdir}`);
                        } catch (error) {
                            totalErrors++;
                            outputChannel.appendLine(`[${getTimestamp()}]   - Error deleting ${dirToClean}: ${error.message}`);
                        }
                    }
                }
            }
        });

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        outputChannel.appendLine(`[${getTimestamp()}] Finished. Elapsed: ${elapsedTime}s`);
        outputChannel.appendLine(`[${getTimestamp()}] Total folders deleted: ${totalCleaned}, Errors: ${totalErrors}`);

        vscode.window.showInformationMessage(
            `Cleaned ${projectDirs.length} project(s). ${totalCleaned} folders removed. ${totalErrors} error(s).`
        );

    } catch (error) {
        outputChannel.appendLine(`[${getTimestamp()}] Error: ${error.message}`);
        vscode.window.showErrorMessage(`Error during cleanup: ${error.message}`);
    }
}

/**
 * Find project files recursively using Node.js fs
 * @param {string} dirPath - Directory to search
 * @param {string[]} extensions - File extensions to look for
 * @param {vscode.OutputChannel} outputChannel - Output channel for logging
 * @param {number} maxDepth - Maximum depth to search (default: 5)
 * @param {number} currentDepth - Current recursion depth
 * @returns {string[]} - Array of found file paths
 */
function findProjectFilesRecursive(dirPath, extensions, outputChannel, maxDepth = 20, currentDepth = 0) {
    const results = [];
    
    if (currentDepth >= maxDepth) {
        return results;
    }
    
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            
            // Skip common directories that shouldn't contain project files
            if (item.isDirectory()) {
                const dirName = item.name.toLowerCase();
                if (['node_modules', 'bin', 'obj', '.git', '.vs', 'packages'].includes(dirName)) {
                    continue;
                }
                
                // Recursively search subdirectories
                const subResults = findProjectFilesRecursive(fullPath, extensions, outputChannel, maxDepth, currentDepth + 1);
                results.push(...subResults);
            } else {
                // Check if file has matching extension
                const ext = path.extname(item.name).toLowerCase();
                if (extensions.includes(ext)) {
                    results.push(fullPath);
                }
            }
        }
    } catch (error) {
        // Silently skip directories we can't access
    }
    
    return results;
}

/**
 * Clean a directory by removing all files and subdirectories
 * @param {string} dirPath - Directory path to clean
 * @param {vscode.OutputChannel} outputChannel - Output channel for logging
 * @returns {Promise<{filesDeleted: number, dirsDeleted: number}>}
 */
async function cleanDirectory(dirPath, outputChannel) {
    let filesDeleted = 0;
    let dirsDeleted = 0;

    if (!fs.existsSync(dirPath)) {
        return { filesDeleted, dirsDeleted };
    }

    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        try {
            if (item.isDirectory()) {
                // Recursively delete directory
                await deleteDirectoryRecursive(fullPath);
                dirsDeleted++;
            } else {
                // Delete file
                fs.unlinkSync(fullPath);
                filesDeleted++;
            }
        } catch (error) {
            outputChannel.appendLine(`[${getTimestamp()}]     Warning: Could not delete ${fullPath}: ${error.message}`);
        }
    }

    return { filesDeleted, dirsDeleted };
}

/**
 * Recursively delete a directory
 * @param {string} dirPath - Directory path to delete
 */
async function deleteDirectoryRecursive(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return;
    }

    try {
        // Use fs.rmSync with recursive option (Node.js 14.14.0+)
        fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (error) {
        // Fallback to manual deletion if rmSync fails
        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
                await deleteDirectoryRecursive(fullPath);
            } else {
                try {
                    fs.unlinkSync(fullPath);
                } catch (e) {
                    // Ignore individual file errors
                }
            }
        }

        try {
            fs.rmdirSync(dirPath);
        } catch (e) {
            // Ignore final rmdir error
        }
    }
}

/**
 * Get formatted timestamp
 * @returns {string}
 */
function getTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
}

/**
 * Clean and rebuild workspace
 */
async function cleanAndRebuildWorkspace(outputChannel) {
    await cleanWorkspace(outputChannel);
    await rebuildProjects(outputChannel, true);
}

/**
 * Clean and rebuild current project
 */
async function cleanAndRebuildCurrentProject(outputChannel) {
    const projectFile = await cleanCurrentProject(outputChannel);
    if (projectFile) {
        await rebuildProjects(outputChannel, false, projectFile);
    }
}

/**
 * Rebuild projects using dotnet build
 * @param {vscode.OutputChannel} outputChannel - Output channel
 * @param {boolean} isWorkspace - Whether to build entire workspace or current project
 * @param {string} projectFile - Optional project file path (for current project rebuild)
 */
async function rebuildProjects(outputChannel, isWorkspace, projectFile = null) {
    outputChannel.appendLine(`[${getTimestamp()}] Starting rebuild...`);
    
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder opened');
        return;
    }

    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);

        // Check if dotnet is installed
        try {
            await execPromise('dotnet --version');
        } catch (error) {
            vscode.window.showErrorMessage('.NET SDK not found. Please install .NET SDK to use rebuild feature.');
            outputChannel.appendLine(`[${getTimestamp()}] .NET SDK not found`);
            return;
        }

        let buildPath;
        if (isWorkspace) {
            // Find .sln file in workspace for better build
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const slnFiles = findProjectFilesRecursive(workspacePath, ['.sln'], outputChannel, 10);
            
            if (slnFiles.length > 0) {
                buildPath = slnFiles[0]; // Use first .sln found
                outputChannel.appendLine(`[${getTimestamp()}] Found solution: ${buildPath}`);
            } else {
                buildPath = workspacePath;
                outputChannel.appendLine(`[${getTimestamp()}] No .sln found, building workspace folder`);
            }
        } else {
            // Use projectFile passed from cleanCurrentProject
            if (projectFile) {
                buildPath = projectFile;
            } else {
                vscode.window.showErrorMessage('No project file specified for rebuild');
                return;
            }
        }

        outputChannel.appendLine(`[${getTimestamp()}] Building: ${buildPath}`);
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Rebuilding project(s)...",
            cancellable: false
        }, async () => {
            try {
                const { stdout, stderr } = await execPromise(`dotnet build "${buildPath}"`, {
                    cwd: path.dirname(buildPath)
                });
                
                if (stdout) {
                    outputChannel.appendLine(stdout);
                }
                if (stderr) {
                    outputChannel.appendLine(`[${getTimestamp()}] Warnings/Errors:`);
                    outputChannel.appendLine(stderr);
                }
                
                outputChannel.appendLine(`[${getTimestamp()}] Rebuild completed successfully`);
                vscode.window.showInformationMessage('Rebuild completed successfully');
            } catch (error) {
                outputChannel.appendLine(`[${getTimestamp()}] Rebuild failed: ${error.message}`);
                if (error.stdout) outputChannel.appendLine(error.stdout);
                if (error.stderr) outputChannel.appendLine(error.stderr);
                vscode.window.showErrorMessage(`Rebuild failed: ${error.message}`);
            }
        });
    } catch (error) {
        outputChannel.appendLine(`[${getTimestamp()}] Error: ${error.message}`);
        vscode.window.showErrorMessage(`Rebuild error: ${error.message}`);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
