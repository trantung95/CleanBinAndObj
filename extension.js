const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const VietnamIconRotator = require('./lib/vietnamese-food-icons');

// Global lock to prevent concurrent operations
let isOperationInProgress = false;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('Clean Bin and Obj');
    
    // Dispose outputChannel when extension deactivates
    context.subscriptions.push(outputChannel);

    // Command to show options and clean
    let cleanCommand = vscode.commands.registerCommand('cleanBinObj.clean', async () => {
        if (isOperationInProgress) {
            vscode.window.showWarningMessage('Another clean/rebuild operation is already in progress');
            return;
        }
        
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

        try {
            isOperationInProgress = true;
            
            if (choice === 'Clean Entire Workspace') {
                await cleanWorkspace(outputChannel);
            } else if (choice === 'Clean Current Project') {
                await cleanCurrentProject(outputChannel);
            } else if (choice === 'Clean & Rebuild Entire Workspace') {
                await cleanAndRebuildWorkspace(outputChannel);
            } else if (choice === 'Clean & Rebuild Current Project') {
                await cleanAndRebuildCurrentProject(outputChannel);
            }
        } finally {
            isOperationInProgress = false;
        }
    });

    // Command to clean entire workspace directly
    let cleanWorkspaceCommand = vscode.commands.registerCommand('cleanBinObj.cleanWorkspace', async () => {
        if (isOperationInProgress) {
            vscode.window.showWarningMessage('Another clean/rebuild operation is already in progress');
            return;
        }
        try {
            isOperationInProgress = true;
            await cleanWorkspace(outputChannel);
        } finally {
            isOperationInProgress = false;
        }
    });

    // Command to clean current project directly
    let cleanCurrentProjectCommand = vscode.commands.registerCommand('cleanBinObj.cleanCurrentProject', async () => {
        if (isOperationInProgress) {
            vscode.window.showWarningMessage('Another clean/rebuild operation is already in progress');
            return;
        }
        try {
            isOperationInProgress = true;
            await cleanCurrentProject(outputChannel);
        } finally {
            isOperationInProgress = false;
        }
    });

    // Command to clean and rebuild workspace
    let cleanAndRebuildWorkspaceCommand = vscode.commands.registerCommand('cleanBinObj.cleanAndRebuildWorkspace', async () => {
        if (isOperationInProgress) {
            vscode.window.showWarningMessage('Another clean/rebuild operation is already in progress');
            return;
        }
        try {
            isOperationInProgress = true;
            await cleanAndRebuildWorkspace(outputChannel);
        } finally {
            isOperationInProgress = false;
        }
    });

    // Command to clean and rebuild current project
    let cleanAndRebuildCurrentProjectCommand = vscode.commands.registerCommand('cleanBinObj.cleanAndRebuildCurrentProject', async () => {
        if (isOperationInProgress) {
            vscode.window.showWarningMessage('Another clean/rebuild operation is already in progress');
            return;
        }
        try {
            isOperationInProgress = true;
            await cleanAndRebuildCurrentProject(outputChannel);
        } finally {
            isOperationInProgress = false;
        }
    });

    // Easter Egg: Send me a Bánh Mì 🥖 - Animated cooking experience with themed webview!
    let banhMiCommand = vscode.commands.registerCommand('cleanBinObj.banhMi', async () => {
        // Create webview panel with VS Code theme support
        const panel = vscode.window.createWebviewPanel(
            'banhMiEasterEgg',
            '🥖 Bánh Mì',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getBanhMiWebviewContent();
    });

    context.subscriptions.push(cleanCommand);
    context.subscriptions.push(cleanWorkspaceCommand);
    context.subscriptions.push(cleanCurrentProjectCommand);
    context.subscriptions.push(cleanAndRebuildWorkspaceCommand);
    context.subscriptions.push(cleanAndRebuildCurrentProjectCommand);
    context.subscriptions.push(banhMiCommand);
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
        vscode.window.showErrorMessage(
            'No file is currently open. Please open a file in your project to use this command.',
            'Open File'
        ).then(selection => {
            if (selection === 'Open File') {
                vscode.commands.executeCommand('workbench.action.files.openFile');
            }
        });
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
        vscode.window.showErrorMessage(
            'No .NET project file found for current file. Make sure you\'re in a .NET project directory.',
            'View Output'
        ).then(selection => {
            if (selection === 'View Output') {
                outputChannel.show();
            }
        });
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
    let currentDir = path.resolve(startDir); // Resolve to absolute path
    const maxLevelsUp = 100;
    const visitedDirs = new Set(); // Track visited directories to prevent infinite loops
    
    for (let i = 0; i < maxLevelsUp; i++) {
        // Prevent infinite loops from symlinks
        const normalizedDir = path.normalize(currentDir);
        if (visitedDirs.has(normalizedDir)) {
            outputChannel.appendLine(`[${getTimestamp()}] Circular directory reference detected, stopping search`);
            break;
        }
        visitedDirs.add(normalizedDir);
        
        // Only log every 10 levels to reduce spam
        if (i === 0 || i % 10 === 0) {
            outputChannel.appendLine(`[${getTimestamp()}] Searching in: ${currentDir}`);
        }
        
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
            outputChannel.appendLine(`[${getTimestamp()}] Error accessing ${currentDir}: ${error.code || error.message}`);
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
    // Validate rootPaths parameter
    if (!rootPaths || !Array.isArray(rootPaths) || rootPaths.length === 0) {
        const errorMsg = 'Invalid rootPaths: must be a non-empty array';
        outputChannel.appendLine(`[${getTimestamp()}] ERROR: ${errorMsg}`);
        vscode.window.showErrorMessage(errorMsg);
        return;
    }

    const config = vscode.workspace.getConfiguration('cleanBinObj');
    const targetSubdirectories = config.get('targetSubdirectories', ['bin', 'obj']);
    const showOutput = config.get('showOutputChannel', true);

    // Validate config types
    if (!Array.isArray(targetSubdirectories)) {
        const errorMsg = 'Configuration error: targetSubdirectories must be an array';
        outputChannel.appendLine(`[${getTimestamp()}] ERROR: ${errorMsg}`);
        vscode.window.showErrorMessage(errorMsg);
        return;
    }

    // Check for empty array
    if (targetSubdirectories.length === 0) {
        const errorMsg = 'Configuration error: targetSubdirectories cannot be empty';
        outputChannel.appendLine(`[${getTimestamp()}] ERROR: ${errorMsg}`);
        vscode.window.showErrorMessage(errorMsg);
        return;
    }

    // Validate each element is a string
    if (!targetSubdirectories.every(dir => typeof dir === 'string')) {
        const errorMsg = 'Configuration error: All targetSubdirectories must be strings';
        outputChannel.appendLine(`[${getTimestamp()}] ERROR: ${errorMsg}`);
        vscode.window.showErrorMessage(errorMsg);
        return;
    }

    // Validate targetSubdirectories for path traversal and absolute paths
    const invalidDirs = targetSubdirectories.filter(dir => {
        // Trim whitespace
        const trimmed = dir.trim();
        if (trimmed.length === 0) return true; // Empty strings not allowed
        
        // Reject absolute paths
        if (path.isAbsolute(trimmed)) return true;
        
        // Reject parent directory references
        if (trimmed.includes('..')) return true;
        
        // Normalize and check it doesn't try to escape
        const normalized = path.normalize(trimmed);
        
        // After normalization, path should not start with '..' or path separator
        if (normalized.startsWith('..')) return true;
        if (path.isAbsolute(normalized)) return true;
        
        return false; // Path is valid
    });
    
    if (invalidDirs.length > 0) {
        const errorMsg = `Invalid target directories detected: ${invalidDirs.join(', ')}. Paths must be relative (like 'bin', 'obj', 'bin/Debug') and cannot contain '..' or be absolute paths.`;
        outputChannel.appendLine(`[${getTimestamp()}] ERROR: ${errorMsg}`);
        vscode.window.showErrorMessage(errorMsg);
        return;
    }

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
        
        if (projectDirs.length === 0) {
            outputChannel.appendLine(`[${getTimestamp()}] No valid project directories found`);
            vscode.window.showInformationMessage('No valid project directories found');
            return;
        }
        
        outputChannel.appendLine(`[${getTimestamp()}] Projects to clean: ${projectDirs.length}`);

        let totalCleaned = 0;
        let totalErrors = 0;

        // Progress indicator with Vietnamese food icons
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Cleaning bin and obj folders",
            cancellable: true
        }, async (progress, token) => {
            const iconRotator = new VietnamIconRotator(progress.report.bind(progress));
            iconRotator.start();

            try {
                for (let i = 0; i < projectDirs.length; i++) {
                    // Check if user cancelled
                    if (token.isCancellationRequested) {
                        outputChannel.appendLine(`[${getTimestamp()}] Operation cancelled by user`);
                        vscode.window.showWarningMessage('Clean operation cancelled');
                        return;
                    }

                    const projectDir = projectDirs[i];
                    const projectName = path.basename(projectDir);

                    iconRotator.report({
                        increment: (100 / projectDirs.length),
                        message: `Cleaning ${projectName} (${i + 1}/${projectDirs.length})`
                    });

                    outputChannel.appendLine(`[${getTimestamp()}] Cleaning: ${projectDir}`);

                    for (const subdir of targetSubdirectories) {
                        const dirToClean = path.join(projectDir, subdir);

                        try {
                            // Delete entire folder - deleteDirectoryRecursive handles non-existent paths
                            const existed = await deleteDirectoryRecursive(dirToClean);
                            if (existed) {
                                totalCleaned++;
                                outputChannel.appendLine(`[${getTimestamp()}]   - Deleted folder: ${subdir}`);
                            }
                        } catch (error) {
                            totalErrors++;
                            let errorMsg = error.message;
                            if (error.code === 'EBUSY' || error.code === 'EPERM') {
                                errorMsg += ' (File may be in use by another process)';
                            }
                            outputChannel.appendLine(`[${getTimestamp()}]   - Error deleting ${dirToClean}: ${errorMsg}`);
                        }
                    }
                }
            } finally {
                iconRotator.stop();
            }
        });

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        outputChannel.appendLine(`[${getTimestamp()}] Finished. Elapsed: ${elapsedTime}s`);
        outputChannel.appendLine(`[${getTimestamp()}] Total folders deleted: ${totalCleaned}, Errors: ${totalErrors}`);

        // Show summary notification
        if (totalErrors > 0) {
            vscode.window.showWarningMessage(
                `Cleaned ${projectDirs.length} project(s) in ${elapsedTime}s. ${totalCleaned} folders removed, ${totalErrors} error(s). Click to view details.`,
                'View Output'
            ).then(selection => {
                if (selection === 'View Output') {
                    outputChannel.show();
                }
            });
        } else {
            vscode.window.showInformationMessage(
                `✅ Successfully cleaned ${projectDirs.length} project(s) in ${elapsedTime}s. ${totalCleaned} folders removed.`
            );
        }

    } catch (error) {
        outputChannel.appendLine(`[${getTimestamp()}] Error: ${error.message}`);
        if (error.stack) {
            outputChannel.appendLine(`Stack trace: ${error.stack}`);
        }
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
function findProjectFilesRecursive(dirPath, extensions, outputChannel, maxDepth = 20, currentDepth = 0, visitedDirs = new Set()) {
    const results = [];
    
    // Validate maxDepth to prevent stack overflow
    const safeMaxDepth = Math.min(Math.max(1, maxDepth), 100);
    
    if (currentDepth >= safeMaxDepth) {
        return results;
    }
    
    // Prevent infinite loops from symlinks
    const normalizedPath = path.normalize(path.resolve(dirPath));
    if (visitedDirs.has(normalizedPath)) {
        return results;
    }
    visitedDirs.add(normalizedPath);
    
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
                const subResults = findProjectFilesRecursive(fullPath, extensions, outputChannel, maxDepth, currentDepth + 1, visitedDirs);
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
 * Recursively delete a directory
 * @param {string} dirPath - Directory path to delete
 * @returns {Promise<boolean>} True if directory existed and was deleted, false if didn't exist
 */
async function deleteDirectoryRecursive(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return false;
    }

    try {
        // Use fs.rmSync with recursive option (Node.js 14.14.0+)
        fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        return true;
    } catch (error) {
        // Fallback to manual deletion if rmSync fails
        try {
            const items = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                
                if (item.isDirectory()) {
                    await deleteDirectoryRecursive(fullPath);
                } else {
                    try {
                        fs.unlinkSync(fullPath);
                    } catch (e) {
                        // File might be in use, will be caught by outer try-catch
                    }
                }
            }

            fs.rmdirSync(dirPath);
            return true;
        } catch (fallbackError) {
            // Re-throw the original error with more context
            throw new Error(`Failed to delete ${dirPath}: ${error.message} (Fallback also failed: ${fallbackError.message})`);
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
    const BuildProcessManager = require('./lib/build-process-manager');
    outputChannel.appendLine(`[${getTimestamp()}] Starting rebuild...`);

    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder opened');
        return;
    }

    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    try {
        // Check if dotnet is installed
        try {
            await execPromise('dotnet --version');
        } catch (error) {
            vscode.window.showErrorMessage(
                '.NET SDK not found. Please install .NET SDK to use rebuild feature.',
                'Download .NET SDK'
            ).then(selection => {
                if (selection === 'Download .NET SDK') {
                    vscode.env.openExternal(vscode.Uri.parse('https://dotnet.microsoft.com/download'));
                }
            });
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

        // Pre-count projects for progress tracking
        let totalProjects = 1; // Default to 1
        let showCounter = true; // Show counter by default
        let progressTitle = "Rebuilding project(s)";
        let staticProjectName = null; // For single project rebuild

        if (isWorkspace || buildPath.endsWith('.sln')) {
            const projectFiles = findProjectFilesRecursive(
                path.dirname(buildPath),
                ['.csproj', '.fsproj', '.vbproj'],
                outputChannel,
                50
            );
            totalProjects = projectFiles.length;
            outputChannel.appendLine(`[${getTimestamp()}] Found ${totalProjects} project(s) to build`);
        } else {
            // Single project rebuild - show only selected project name
            showCounter = false;
            const projectName = path.basename(buildPath, path.extname(buildPath));
            staticProjectName = projectName.length > 30
                ? '...' + projectName.slice(-27)
                : projectName;
            progressTitle = "Rebuilding project";
        }

        // Progress indicator with Vietnamese food icons
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: progressTitle,
            cancellable: true
        }, async (progress, token) => {
            const iconRotator = new VietnamIconRotator(progress.report.bind(progress));
            iconRotator.start();

            return new Promise((resolve, reject) => {
                // Create process manager with pre-counted projects
                const processManager = new BuildProcessManager(
                    buildPath,
                    outputChannel,
                    // onProgress callback - use iconRotator for Vietnamese food icons
                    ({ message, increment }) => {
                        iconRotator.report({
                            message: message,
                            increment: increment
                        });
                    },
                    // onComplete callback
                    ({ elapsed }) => {
                        iconRotator.stop();
                        outputChannel.appendLine(`[${getTimestamp()}] Rebuild completed successfully in ${elapsed}s`);
                        vscode.window.showInformationMessage(`✅ Rebuild completed successfully in ${elapsed}s`);
                        resolve();
                    },
                    // onError callback
                    ({ message, cancelled, elapsed }) => {
                        iconRotator.stop();
                        if (cancelled) {
                            outputChannel.appendLine(`[${getTimestamp()}] Build cancelled`);
                            vscode.window.showWarningMessage('Build operation cancelled');
                            resolve(); // Resolve, not reject, for cancellation
                        } else {
                            outputChannel.appendLine(`[${getTimestamp()}] Rebuild failed: ${message}`);
                            if (elapsed) {
                                outputChannel.appendLine(`[${getTimestamp()}] Build ran for ${elapsed}s before failing`);
                            }
                            vscode.window.showErrorMessage(
                                `Rebuild failed: ${message}`,
                                'View Output'
                            ).then(selection => {
                                if (selection === 'View Output') {
                                    outputChannel.show();
                                }
                            });
                            reject(new Error(message));
                        }
                    },
                    // Total projects count, showCounter flag, and static project name
                    totalProjects,
                    showCounter,
                    staticProjectName
                );

                // Start the build process
                try {
                    processManager.start(token);
                } catch (error) {
                    iconRotator.stop();
                    outputChannel.appendLine(`[${getTimestamp()}] Failed to start build: ${error.message}`);
                    reject(error);
                }
            });
        });
    } catch (error) {
        outputChannel.appendLine(`[${getTimestamp()}] Error: ${error.message}`);
        if (error.stack) {
            outputChannel.appendLine(`Stack trace: ${error.stack}`);
        }
        vscode.window.showErrorMessage(`Rebuild error: ${error.message}`);
    }
}

function deactivate() {}

/**
 * Generate Bánh Mì Easter Egg webview content with VS Code theme support
 */
function getBanhMiWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🥖 Bánh Mì</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            text-align: center;
            max-width: 500px;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: var(--vscode-textLink-foreground);
        }
        .subtitle {
            font-size: 1.1em;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 30px;
        }
        .cooking-container {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .step-icon {
            font-size: 3em;
            margin-bottom: 10px;
            animation: bounce 0.5s ease infinite;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .step-text {
            font-size: 1.2em;
            margin-bottom: 5px;
        }
        .step-text-en {
            font-size: 0.95em;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: var(--vscode-progressBar-background);
            border-radius: 4px;
            margin-top: 15px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-background);
            background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #1dd1a1);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        .banh-mi-art {
            font-size: 1.5em;
            line-height: 1.4;
            margin: 20px 0;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.5s ease;
        }
        .banh-mi-art.show {
            opacity: 1;
            transform: scale(1);
        }
        .message-box {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.5s ease;
        }
        .message-box.show {
            opacity: 1;
            transform: translateY(0);
        }
        .message-box h2 {
            color: var(--vscode-textLink-foreground);
            margin-bottom: 10px;
        }
        .message-box p {
            margin: 8px 0;
            line-height: 1.5;
        }
        .crypto-wallet {
            background: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
            padding: 10px 15px;
            margin: 15px 0;
            font-family: var(--vscode-editor-font-family);
        }
        .extension-name {
            background: linear-gradient(135deg, var(--vscode-button-background), var(--vscode-button-hoverBackground));
            color: var(--vscode-button-foreground);
            padding: 12px 20px;
            border-radius: 6px;
            margin: 15px 0;
            font-size: 1.05em;
        }
        .footer {
            margin-top: 15px;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
        .flag {
            display: inline-block;
            animation: wave 1s ease-in-out infinite;
        }
        @keyframes wave {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
        }
        .hidden {
            display: none;
        }
        .celebration {
            font-size: 2em;
            animation: celebrate 0.5s ease infinite;
        }
        @keyframes celebrate {
            0%, 100% { transform: scale(1) rotate(0deg); }
            25% { transform: scale(1.1) rotate(-5deg); }
            75% { transform: scale(1.1) rotate(5deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🥖 Bánh Mì</h1>
        <p class="subtitle">Vietnamese Sandwich Experience</p>

        <div class="cooking-container" id="cookingContainer">
            <div class="step-icon" id="stepIcon">🛒</div>
            <div class="step-text" id="stepText">Đi chợ...</div>
            <div class="step-text-en" id="stepTextEn">Going to market...</div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill" style="width: 0%"></div>
            </div>
        </div>

        <div class="banh-mi-art" id="banhMiArt">
            <div>🥖🥖🥖🥖🥖🥖🥖</div>
            <div>┌─────────────┐</div>
            <div>│ 🥩🥒🥕🌿🧈 │</div>
            <div>└─────────────┘</div>
            <div>🥖🥖🥖🥖🥖🥖🥖</div>
        </div>

        <div class="message-box" id="messageBox">
            <div class="celebration" id="celebration">🎉</div>
            <h2>Your Bánh Mì is ready! <span class="flag">🇻🇳</span></h2>
            <p>If this extension saved you time,<br>consider sending me a Vietnamese sandwich!</p>
            <div class="crypto-wallet">
                ☕ <strong>Crypto wallet:</strong> Coming soon...
            </div>
            <div class="extension-name">
                🧹 <strong>Clean Bin Obj</strong> - .NET Build Cleaner & Rebuild Tool
            </div>
            <p class="footer">🪷 Made with cà phê sữa đá in Vietnam 🍜</p>
        </div>
    </div>

    <script>
        const cookingSteps = [
            { icon: '🛒', vn: 'Đi chợ...', en: 'Going to market...' },
            { icon: '🥖', vn: 'Mua bánh mì giòn...', en: 'Buying crispy baguette...' },
            { icon: '🥩', vn: 'Chọn thịt ngon...', en: 'Selecting good meat...' },
            { icon: '🔥', vn: 'Nướng thịt...', en: 'Grilling the pork...' },
            { icon: '🥒', vn: 'Cắt dưa chuột...', en: 'Slicing cucumber...' },
            { icon: '🥕', vn: 'Thêm đồ chua...', en: 'Adding pickled carrots...' },
            { icon: '🌿', vn: 'Rắc rau thơm...', en: 'Sprinkling fresh herbs...' },
            { icon: '🌶️', vn: 'Thêm ớt...', en: 'Adding chili...' },
            { icon: '🧈', vn: 'Phết pa-tê...', en: 'Spreading pâté...' },
            { icon: '🫗', vn: 'Xịt nước tương...', en: 'Drizzling soy sauce...' },
            { icon: '✨', vn: 'Hoàn thành!', en: 'Complete!' },
        ];

        const celebrationEmojis = ['🎉', '🎊', '🥳', '🇻🇳', '🥖', '🍜', '☕'];

        let currentStep = 0;
        const stepIcon = document.getElementById('stepIcon');
        const stepText = document.getElementById('stepText');
        const stepTextEn = document.getElementById('stepTextEn');
        const progressFill = document.getElementById('progressFill');
        const cookingContainer = document.getElementById('cookingContainer');
        const banhMiArt = document.getElementById('banhMiArt');
        const messageBox = document.getElementById('messageBox');
        const celebration = document.getElementById('celebration');

        function updateStep() {
            if (currentStep < cookingSteps.length) {
                const step = cookingSteps[currentStep];
                stepIcon.textContent = step.icon;
                stepText.textContent = step.vn;
                stepTextEn.textContent = step.en;
                progressFill.style.width = ((currentStep + 1) / cookingSteps.length * 100) + '%';
                currentStep++;
                setTimeout(updateStep, 700);
            } else {
                // Cooking complete - show final result
                setTimeout(() => {
                    cookingContainer.classList.add('hidden');
                    banhMiArt.classList.add('show');
                    setTimeout(() => {
                        messageBox.classList.add('show');
                        // Start celebration animation
                        let emojiIndex = 0;
                        setInterval(() => {
                            celebration.textContent = celebrationEmojis[emojiIndex];
                            emojiIndex = (emojiIndex + 1) % celebrationEmojis.length;
                        }, 400);
                    }, 500);
                }, 300);
            }
        }

        // Start the cooking animation
        setTimeout(updateStep, 500);
    </script>
</body>
</html>`;
}

module.exports = {
    activate,
    deactivate
};
