const { spawn } = require('child_process');
const path = require('path');
const BuildProgressTracker = require('./build-progress-tracker');

/**
 * Manages the build process with streaming output and progress tracking
 */
class BuildProcessManager {
    constructor(buildPath, outputChannel, onProgress, onComplete, onError, totalProjects = 0, showCounter = true, staticProjectName = null) {
        this.buildPath = buildPath;
        this.outputChannel = outputChannel;
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.onError = onError;
        this.staticProjectName = staticProjectName;

        this.progressTracker = new BuildProgressTracker(totalProjects, showCounter, staticProjectName);

        this.process = null;
        this.isActive = false;
        this.isCancelled = false;
        this.callbacksFired = false;
        this.partialLine = '';

        this.startTime = null;
        this.timeoutId = null;
        this.timeoutMs = 15 * 60 * 1000; // 15 minutes
    }

    /**
     * Get timestamp for logging
     */
    getTimestamp() {
        const now = new Date();
        return now.toTimeString().split(' ')[0] + '.' + now.getMilliseconds().toString().padStart(3, '0');
    }

    /**
     * Start the build process
     * @param {vscode.CancellationToken} cancellationToken - VS Code cancellation token
     */
    start(cancellationToken) {
        if (this.isActive) {
            throw new Error('Build process already running');
        }

        this.isActive = true;
        this.isCancelled = false;
        this.startTime = Date.now();

        // Setup timeout
        this.timeoutId = setTimeout(() => {
            this.cancel('Build timeout exceeded (15 minutes)');
        }, this.timeoutMs);

        // Setup cancellation handler
        if (cancellationToken) {
            cancellationToken.onCancellationRequested(() => {
                this.cancel('User cancelled');
            });
        }

        // Spawn dotnet build process
        this.process = spawn('dotnet', ['build', this.buildPath], {
            cwd: path.dirname(this.buildPath),
            shell: true,
            windowsHide: true
        });

        // Handle stdout (main output)
        this.process.stdout.on('data', (data) => {
            this.handleOutput(data.toString());
        });

        // Handle stderr (warnings/errors)
        this.process.stderr.on('data', (data) => {
            const text = data.toString();
            this.outputChannel.appendLine(`[${this.getTimestamp()}] [STDERR] ${text}`);
            // Also parse stderr as it might contain useful info
            this.handleOutput(text);
        });

        // Handle process exit
        this.process.on('close', (code) => {
            if (this.isCancelled || this.callbacksFired) {
                // Already handled in cancel() or by error handler
                this.cleanup();
                return;
            }

            this.callbacksFired = true;
            this.cleanup();

            const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);

            if (code === 0) {
                this.onComplete({ success: true, elapsed });
            } else {
                this.onError({
                    message: `Build failed with exit code ${code}`,
                    code,
                    elapsed
                });
            }
        });

        // Handle process errors
        this.process.on('error', (error) => {
            if (this.callbacksFired) {
                this.cleanup();
                return;
            }

            this.callbacksFired = true;
            this.cleanup();
            this.onError({
                message: `Failed to start build process: ${error.message}`,
                error
            });
        });
    }

    /**
     * Handle output data (line-by-line processing)
     * @param {string} data - Output data chunk
     */
    handleOutput(data) {
        // Append to partial line buffer
        this.partialLine += data;

        // Split into lines
        const lines = this.partialLine.split(/\r?\n/);

        // Keep the last incomplete line in buffer
        this.partialLine = lines.pop() || '';

        // Process each complete line
        for (const line of lines) {
            if (line.trim()) {
                this.processLine(line);
            }
        }
    }

    /**
     * Process a single line
     * @param {string} line - Complete line of output
     */
    processLine(line) {
        // Log to output channel
        this.outputChannel.appendLine(line);

        // Simple pattern: detect project completion by "  ProjectName -> path/to/ProjectName.dll"
        const completeMatch = line.match(/^\s+(.+?)\s+->\s+(.+\.dll)$/);
        if (completeMatch) {
            const projectName = completeMatch[1];
            this.handleProjectComplete(projectName);
        }
    }

    /**
     * Handle project complete event
     */
    handleProjectComplete(projectName) {
        if (!projectName) return;

        // Update progress tracker
        this.progressTracker.startProject(projectName);

        // Report progress
        const message = this.progressTracker.getProgressMessage();
        const increment = this.progressTracker.getIncrement();

        if (this.onProgress) {
            this.onProgress({ message, increment });
        }
    }

    /**
     * Cancel the build process
     * @param {string} reason - Cancellation reason
     */
    cancel(reason = 'Cancelled') {
        if (!this.isActive || this.isCancelled || this.callbacksFired) {
            return;
        }

        this.isCancelled = true;
        this.callbacksFired = true;
        this.outputChannel.appendLine(`[${this.getTimestamp()}] Build cancelled: ${reason}`);

        if (this.process && !this.process.killed) {
            try {
                // On Windows, use taskkill for better process tree termination
                if (process.platform === 'win32') {
                    this.process.kill('SIGKILL');
                } else {
                    this.process.kill('SIGTERM');
                }
            } catch (error) {
                this.outputChannel.appendLine(`[${this.getTimestamp()}] Failed to kill process: ${error.message}`);
            }
        }

        this.cleanup();

        if (this.onError) {
            this.onError({ message: reason, cancelled: true });
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.isActive = false;

        // Remove event listeners to prevent memory leaks
        if (this.process) {
            if (this.process.stdout) {
                this.process.stdout.removeAllListeners();
            }
            if (this.process.stderr) {
                this.process.stderr.removeAllListeners();
            }
            this.process.removeAllListeners();
        }

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        // Process final buffered line if any (only if not cancelled to avoid progress updates after error)
        if (this.partialLine.trim() && !this.isCancelled && !this.callbacksFired) {
            this.processLine(this.partialLine);
        }
        this.partialLine = '';
    }

    /**
     * Check if process is running
     */
    isRunning() {
        return this.isActive;
    }
}

module.exports = BuildProcessManager;
