const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

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

        // Progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Cleaning bin and obj folders",
            cancellable: true
        }, async (progress, token) => {
            for (let i = 0; i < projectDirs.length; i++) {
                // Check if user cancelled
                if (token.isCancellationRequested) {
                    outputChannel.appendLine(`[${getTimestamp()}] Operation cancelled by user`);
                    vscode.window.showWarningMessage('Clean operation cancelled');
                    return;
                }
                
                const projectDir = projectDirs[i];
                const projectName = path.basename(projectDir);
                
                progress.report({ 
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
    const rebuildStartTime = Date.now();
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
        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Rebuilding project(s)...",
            cancellable: true
        }, async (progress, token) => {
            // Add timeout protection (15 minutes)
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Build timeout exceeded (15 minutes)')), 15 * 60 * 1000);
            });
            
            // Track build progress
            let currentStep = '';
            let buildOutput = '';
            let totalProjects = 0;
            let currentProject = 0;
            
            // Helper function to truncate long project names
            const truncateProjectName = (name, maxLength = 30) => {
                if (name.length <= maxLength) return name;
                return '...' + name.slice(-(maxLength - 3));
            };
            
            // Start build process
            let buildProcess = null;
            const buildPromise = new Promise((resolve, reject) => {
                const { spawn } = require('child_process');
                buildProcess = spawn('dotnet', ['build', buildPath], {
                    cwd: path.dirname(buildPath),
                    shell: true
                });
                
                let stdout = '';
                let stderr = '';
                
                // Real-time stdout processing
                buildProcess.stdout.on('data', (data) => {
                    const output = data.toString();
                    stdout += output;
                    outputChannel.append(output);
                    
                    // Parse build output for progress
                    const lines = output.split('\n');
                    for (const line of lines) {
                        // Detect total project count
                        const projectCountMatch = line.match(/Determining projects to restore.*?(\d+) project/i);
                        if (projectCountMatch) {
                            totalProjects = parseInt(projectCountMatch[1]);
                        }
                        
                        // Detect restore phase
                        if (line.includes('Determining projects to restore')) {
                            currentStep = totalProjects > 0 
                                ? `Restoring packages (${totalProjects} project${totalProjects > 1 ? 's' : ''})...`
                                : 'Restoring packages...';
                            progress.report({ message: currentStep });
                        }
                        // Detect individual project restore
                        else if (line.match(/Restoring.*\.csproj|\.fsproj|\.vbproj/i)) {
                            currentProject++;
                            const projectName = line.match(/([^\\\/]+)\.(csproj|fsproj|vbproj)/i)?.[1] || '';
                            if (projectName) {
                                const displayName = truncateProjectName(projectName);
                                currentStep = totalProjects > 0
                                    ? `Restoring (${currentProject}/${totalProjects}) ${displayName}`
                                    : `Restoring ${displayName}`;
                                progress.report({ message: currentStep });
                            }
                        }
                        // Detect restore completion
                        else if (line.includes('Restored ') || line.includes('restore completed')) {
                            currentStep = 'Packages restored ✓';
                            progress.report({ message: currentStep });
                        }
                        // Detect compilation start
                        else if (line.includes('Building...')) {
                            currentStep = 'Compiling...';
                            progress.report({ message: currentStep });
                        }
                        // Detect project compilation
                        else if (line.match(/Building.*\.csproj|\.fsproj|\.vbproj/i)) {
                            const projectName = line.match(/([^\\\/]+)\.(csproj|fsproj|vbproj)/i)?.[1] || '';
                            if (projectName) {
                                const displayName = truncateProjectName(projectName);
                                currentStep = totalProjects > 0
                                    ? `Building (${currentProject}/${totalProjects}) ${displayName}`
                                    : `Building ${displayName}`;
                                progress.report({ message: currentStep });
                            }
                        }
                        // Detect warnings
                        else if (line.includes('warning ')) {
                            const warningMatch = line.match(/warning\s+(\w+):/i);
                            if (warningMatch) {
                                progress.report({ message: `⚠️ ${warningMatch[1]}` });
                            }
                        }
                        // Detect errors
                        else if (line.includes('error ')) {
                            const errorMatch = line.match(/error\s+(\w+):/i);
                            if (errorMatch) {
                                progress.report({ message: `❌ ${errorMatch[1]}` });
                            }
                        }
                        // Detect build success
                        else if (line.includes('Build succeeded')) {
                            progress.report({ message: '✅ Build succeeded' });
                        }
                        // Detect build failure
                        else if (line.includes('Build FAILED')) {
                            progress.report({ message: '❌ Build failed' });
                        }
                    }
                });
                
                buildProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                    outputChannel.append(data.toString());
                });
                
                buildProcess.on('close', (code) => {
                    if (code !== 0) {
                        const error = new Error(`Build process exited with code ${code}`);
                        error.stdout = stdout;
                        error.stderr = stderr;
                        reject(error);
                    } else {
                        resolve({ stdout, stderr });
                    }
                });
                
                buildProcess.on('error', (error) => {
                    reject(error);
                });
            });
            
            // Handle cancellation - kill the process with SIGTERM (or SIGKILL on Windows)
            const killProcess = () => {
                if (buildProcess && !buildProcess.killed) {
                    try {
                        // On Windows, use taskkill for better process termination
                        if (process.platform === 'win32') {
                            buildProcess.kill('SIGKILL');
                        } else {
                            buildProcess.kill('SIGTERM');
                        }
                        outputChannel.appendLine(`[${getTimestamp()}] Build process terminated by user`);
                    } catch (killError) {
                        outputChannel.appendLine(`[${getTimestamp()}] Failed to kill process: ${killError.message}`);
                    }
                }
            };
            
            token.onCancellationRequested(killProcess);
            
            try {
                if (token.isCancellationRequested) {
                    if (timeoutId) clearTimeout(timeoutId);
                    vscode.window.showWarningMessage('Build operation cancelled');
                    return;
                }
                
                const { stdout, stderr } = await Promise.race([buildPromise, timeoutPromise]);
                
                // Clear timeout to prevent memory leak
                if (timeoutId) clearTimeout(timeoutId);
                
                const rebuildTime = ((Date.now() - rebuildStartTime) / 1000).toFixed(2);
                outputChannel.appendLine(`[${getTimestamp()}] Rebuild completed successfully in ${rebuildTime}s`);
                vscode.window.showInformationMessage(`✅ Rebuild completed successfully in ${rebuildTime}s`);
            } catch (error) {
                // Clear timeout on error
                if (timeoutId) clearTimeout(timeoutId);
                
                if (token.isCancellationRequested) {
                    outputChannel.appendLine(`[${getTimestamp()}] Build cancelled`);
                    return;
                }
                outputChannel.appendLine(`[${getTimestamp()}] Rebuild failed: ${error.message}`);
                if (error.stdout) outputChannel.appendLine(error.stdout);
                if (error.stderr) outputChannel.appendLine(error.stderr);
                vscode.window.showErrorMessage(
                    `Rebuild failed: ${error.message}`,
                    'View Output'
                ).then(selection => {
                    if (selection === 'View Output') {
                        outputChannel.show();
                    }
                });
            }
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

module.exports = {
    activate,
    deactivate
};
