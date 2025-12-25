const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    const outputChannel = vscode.window.createOutputChannel('Clean Bin and Obj');

    // Command to clean from context menu (specific folder)
    let cleanCommand = vscode.commands.registerCommand('cleanBinObj.clean', async (uri) => {
        if (!uri && vscode.window.activeTextEditor) {
            uri = vscode.window.activeTextEditor.document.uri;
        }

        if (!uri) {
            vscode.window.showErrorMessage('No folder selected');
            return;
        }

        const folderPath = uri.fsPath;
        await cleanBinAndObj([folderPath], outputChannel);
    });

    // Command to clean entire workspace
    let cleanWorkspaceCommand = vscode.commands.registerCommand('cleanBinObj.cleanWorkspace', async () => {
        if (!vscode.workspace.workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder opened');
            return;
        }

        const workspacePaths = vscode.workspace.workspaceFolders.map(folder => folder.uri.fsPath);
        await cleanBinAndObj(workspacePaths, outputChannel);
    });

    context.subscriptions.push(cleanCommand);
    context.subscriptions.push(cleanWorkspaceCommand);
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
    outputChannel.appendLine(`Target subdirectories: ${targetSubdirectories.join(', ')}`);

    try {
        // Find all project files
        const projectFiles = [];
        for (const rootPath of rootPaths) {
            for (const pattern of projectPatterns) {
                const files = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(rootPath, pattern),
                    '**/node_modules/**'
                );
                projectFiles.push(...files);
            }
        }

        if (projectFiles.length === 0) {
            outputChannel.appendLine(`[${getTimestamp()}] No project files found`);
            vscode.window.showInformationMessage('No project files found in workspace');
            return;
        }

        outputChannel.appendLine(`[${getTimestamp()}] Found ${projectFiles.length} project file(s)`);

        // Get unique project directories
        const projectDirs = [...new Set(projectFiles.map(file => path.dirname(file.fsPath)))];
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
                            const result = await cleanDirectory(dirToClean, outputChannel);
                            totalCleaned += result.filesDeleted + result.dirsDeleted;
                            outputChannel.appendLine(`[${getTimestamp()}]   - Cleaned ${subdir}: ${result.filesDeleted} files, ${result.dirsDeleted} directories`);
                        } catch (error) {
                            totalErrors++;
                            outputChannel.appendLine(`[${getTimestamp()}]   - Error cleaning ${dirToClean}: ${error.message}`);
                        }
                    }
                }
            }
        });

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        outputChannel.appendLine(`[${getTimestamp()}] Finished. Elapsed: ${elapsedTime}s`);
        outputChannel.appendLine(`[${getTimestamp()}] Total items cleaned: ${totalCleaned}, Errors: ${totalErrors}`);

        vscode.window.showInformationMessage(
            `Cleaned ${projectDirs.length} project(s). ${totalCleaned} items removed. ${totalErrors} error(s).`
        );

    } catch (error) {
        outputChannel.appendLine(`[${getTimestamp()}] Error: ${error.message}`);
        vscode.window.showErrorMessage(`Error during cleanup: ${error.message}`);
    }
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

    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
            await deleteDirectoryRecursive(fullPath);
        } else {
            fs.unlinkSync(fullPath);
        }
    }

    fs.rmdirSync(dirPath);
}

/**
 * Get formatted timestamp
 * @returns {string}
 */
function getTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
