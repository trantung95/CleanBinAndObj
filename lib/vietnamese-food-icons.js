/**
 * Vietnam Icons Module
 *
 * Manages rotating Vietnamese icons for progress notifications.
 * Introduces Vietnamese culture through iconic symbols displayed during
 * clean and rebuild operations.
 */

// Vietnamese cultural icons - unique symbols representing Vietnam
// Excludes icons that may be associated with neighboring countries
const VIETNAM_ICONS = [
    // National Symbols & Flag
    { name: 'Việt Nam', icon: '🇻🇳' },     // Vietnam flag
    { name: 'Sao vàng', icon: '⭐' },       // Golden star - national flag

    // Food & Drinks - distinctly Vietnamese
    { name: 'Phở', icon: '🍜' },           // Vietnam's national dish
    { name: 'Bánh mì', icon: '🥖' },       // Famous Vietnamese sandwich
    { name: 'Cà phê', icon: '☕' },         // Vietnamese coffee culture
    { name: 'Gỏi cuốn', icon: '🌯' },      // Fresh spring rolls
    { name: 'Cơm', icon: '🍚' },           // Rice - staple food
    { name: 'Bánh flan', icon: '🍮' },     // Vietnamese flan
    { name: 'Cháo', icon: '🥣' },          // Rice porridge
    { name: 'Sinh tố', icon: '🥤' },       // Fruit smoothie
    { name: 'Đũa', icon: '🥢' },           // Chopsticks - Vietnamese dining

    // Nature & Animals - uniquely Vietnamese
    { name: 'Trâu', icon: '🐃' },          // Water buffalo - rural Vietnam
    { name: 'Sen', icon: '🪷' },           // Lotus - national flower
    { name: 'Lúa', icon: '🌾' },           // Rice paddy
    { name: 'Dừa', icon: '🥥' },           // Coconut
    { name: 'Xoài', icon: '🥭' },          // Mango
    { name: 'Chuối', icon: '🍌' },         // Banana
    { name: 'Bưởi', icon: '🍊' },          // Pomelo
    { name: 'Dưa hấu', icon: '🍉' },       // Watermelon
    { name: 'Biển', icon: '🏖️' },         // Beaches - Da Nang, Nha Trang
    { name: 'Rừng', icon: '🌴' },          // Tropical forest
    { name: 'Gà', icon: '🐓' },            // Rooster - Vietnamese village life
    { name: 'Lợn', icon: '🐖' },           // Pig - agriculture
    { name: 'Tôm', icon: '🦐' },           // Shrimp - Mekong Delta export
    { name: 'Cua', icon: '🦀' },           // Crab - seafood
    { name: 'Mực', icon: '🦑' },           // Squid - coastal cuisine
    { name: 'Ốc', icon: '🐚' },            // Snail/shellfish - street food

    // Culture & Traditions - distinctly Vietnamese
    { name: 'Xe máy', icon: '🏍️' },       // Motorbike - iconic transport
    { name: 'Đèn giao thông', icon: '🚦' }, // Traffic light - busy Vietnam streets
    { name: 'Múa rối nước', icon: '🎭' },  // Water puppet - unique to Vietnam
];

/**
 * Manages rotating Vietnamese icons for progress notifications.
 * Icons rotate randomly to introduce Vietnamese culture.
 * Default rotation interval: 1-2 seconds (configurable).
 */
class VietnamIconRotator {
    /**
     * Creates a new Vietnam icon rotator
     * @param {Function} onProgress - The progress.report callback function
     * @param {Object} [options] - Configuration options
     * @param {number} [options.minInterval=1000] - Minimum rotation interval in milliseconds
     * @param {number} [options.maxInterval=2000] - Maximum rotation interval in milliseconds
     */
    constructor(onProgress, options = {}) {
        this.onProgress = onProgress;
        this.currentIcon = this._getRandomIcon();
        this.timerId = null;
        this.isActive = false;
        this.lastMessage = '';

        // Rotation interval config (default: 1-2 seconds)
        this.minInterval = options.minInterval || 1000;
        this.maxInterval = options.maxInterval || 2000;
    }

    /**
     * Get a random icon from the dictionary
     * @returns {{name: string, icon: string}}
     * @private
     */
    _getRandomIcon() {
        const index = Math.floor(Math.random() * VIETNAM_ICONS.length);
        return VIETNAM_ICONS[index];
    }

    /**
     * Get random interval between minInterval and maxInterval
     * @returns {number} Milliseconds
     * @private
     */
    _getRandomInterval() {
        const range = this.maxInterval - this.minInterval;
        return Math.floor(Math.random() * range) + this.minInterval;
    }

    /**
     * Schedule the next icon rotation
     * @private
     */
    _scheduleNextRotation() {
        if (!this.isActive) {
            return;
        }

        const interval = this._getRandomInterval();
        this.timerId = setTimeout(() => {
            if (this.isActive) {
                this.currentIcon = this._getRandomIcon();

                // Update progress display with new icon if we have a message
                if (this.lastMessage && this.onProgress) {
                    this.onProgress({
                        message: `${this.currentIcon.icon} ${this.lastMessage}`
                    });
                }

                this._scheduleNextRotation();
            }
        }, interval);
    }

    /**
     * Start icon rotation timer
     */
    start() {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        this.currentIcon = this._getRandomIcon();
        this._scheduleNextRotation();
    }

    /**
     * Stop icon rotation and cleanup timers
     */
    stop() {
        this.isActive = false;

        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }

        this.lastMessage = '';
    }

    /**
     * Report progress with Vietnamese icon prefix
     * @param {{message?: string, increment?: number}} params - Progress parameters
     */
    report(params) {
        if (!this.isActive || !this.onProgress) {
            return;
        }

        this.lastMessage = params.message || '';

        this.onProgress({
            message: `${this.currentIcon.icon} ${this.lastMessage}`,
            increment: params.increment
        });
    }

    /**
     * Get current icon info (for debugging/display)
     * @returns {{name: string, icon: string}}
     */
    getCurrentIcon() {
        return this.currentIcon;
    }
}

module.exports = VietnamIconRotator;
