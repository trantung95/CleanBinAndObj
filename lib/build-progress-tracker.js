const { formatProjectName } = require('./project-formatter');

/**
 * Tracks build progress and generates progress messages
 */
class BuildProgressTracker {
    constructor(totalProjects = 0, showCounter = true, staticProjectName = null) {
        this.totalProjects = totalProjects;
        this.showCounter = showCounter;
        this.staticProjectName = staticProjectName;
        this.currentIndex = 0;
        this.currentProjectName = staticProjectName; // Use static name if provided
        this.seenProjects = new Set();
    }

    /**
     * Start building a project
     * @param {string} projectPath - Project file path or name
     */
    startProject(projectPath) {
        if (!projectPath) return;

        // If we have a static project name, don't update from output
        if (this.staticProjectName) {
            // Just track that we've seen something, but don't update the name
            return;
        }

        // Normalize the project name to handle duplicates
        // Remove any path separators and get just the base name
        const normalizedName = projectPath.replace(/[\\/]/g, '').trim();

        // Only increment if we haven't seen this project yet
        if (!this.seenProjects.has(normalizedName)) {
            this.currentIndex++;
            this.currentProjectName = formatProjectName(projectPath, 30);
            this.seenProjects.add(normalizedName);
        }
    }

    /**
     * Mark project as complete (for future tracking if needed)
     * @param {string} projectPath - Project file path
     */
    completeProject(projectPath) {
        // Currently a no-op, but kept for future completion tracking
        // Projects are already tracked in seenProjects when they start
    }

    /**
     * Update total projects count (for dynamic discovery)
     * @param {number} count - New total count
     */
    setTotalProjects(count) {
        if (count > this.totalProjects) {
            this.totalProjects = count;
        }
    }

    /**
     * Get formatted progress message
     * @returns {string} Progress message like "[1/5] ProjectName" or just "ProjectName" if counter hidden
     */
    getProgressMessage() {
        // If we have a static project name, always show it
        if (this.staticProjectName) {
            return this.staticProjectName;
        }

        if (this.currentIndex === 0) {
            return 'Preparing';
        }

        const projectName = this.currentProjectName || 'project';

        // If counter is hidden, just return the project name
        if (!this.showCounter) {
            return projectName;
        }

        // Otherwise show counter with project name
        const counter = this.totalProjects > 0
            ? `[${this.currentIndex}/${this.totalProjects}]`
            : `[${this.currentIndex}]`;

        return `${counter} ${projectName}`;
    }

    /**
     * Get progress percentage (0-100)
     * @returns {number} Progress percentage
     */
    getProgressPercentage() {
        if (this.totalProjects === 0) {
            return 0;
        }
        return Math.min(100, Math.floor((this.currentIndex / this.totalProjects) * 100));
    }

    /**
     * Get increment for progress.report()
     * @returns {number} Increment value
     */
    getIncrement() {
        if (this.totalProjects === 0) {
            return 0;
        }
        return 100 / this.totalProjects;
    }

    /**
     * Get current state
     * @returns {Object} State object
     */
    getCurrentState() {
        return {
            current: this.currentIndex,
            total: this.totalProjects,
            projectName: this.currentProjectName,
            seen: this.seenProjects.size
        };
    }

    /**
     * Reset tracker state
     */
    reset() {
        this.currentIndex = 0;
        this.currentProjectName = null;
        this.seenProjects.clear();
        // Keep totalProjects if set, as it might be known upfront
    }
}

module.exports = BuildProgressTracker;
