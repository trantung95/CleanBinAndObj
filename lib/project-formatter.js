const path = require('path');

/**
 * Extract project name from file path, removing extension
 * @param {string} filePath - Full path to project file
 * @returns {string} Project name without extension
 */
function extractProjectName(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        return 'Unknown';
    }

    // Get base name with extension
    const baseName = path.basename(filePath);

    // Remove .csproj, .fsproj, .vbproj, .sln extensions
    const extensions = ['.csproj', '.fsproj', '.vbproj', '.sln'];
    for (const ext of extensions) {
        if (baseName.toLowerCase().endsWith(ext.toLowerCase())) {
            return baseName.slice(0, -ext.length);
        }
    }

    // If no recognized extension, return as-is
    return baseName;
}

/**
 * Format project name for display, truncating if necessary
 * @param {string} projectPath - Project file path or name
 * @param {number} maxLength - Maximum length (default: 30)
 * @returns {string} Formatted project name
 */
function formatProjectName(projectPath, maxLength = 30) {
    if (!projectPath || typeof projectPath !== 'string') {
        return 'Unknown';
    }

    // Extract name without extension
    const projectName = extractProjectName(projectPath);

    // If within limit, return as-is
    if (projectName.length <= maxLength) {
        return projectName;
    }

    // Truncate with "..." prefix
    // Reserve 3 chars for "..."
    const truncated = projectName.slice(-(maxLength - 3));
    return `...${truncated}`;
}

module.exports = {
    extractProjectName,
    formatProjectName
};
