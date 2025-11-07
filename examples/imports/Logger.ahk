#Module Logger

/**
 * Simple logging utility for AHK v2 applications
 */

class Logger {
    static LogFile := A_ScriptDir "\app.log"
    static Levels := Map(
        "DEBUG", 0,
        "INFO", 1,
        "WARN", 2,
        "ERROR", 3
    )
    static CurrentLevel := 1  ; INFO by default

    /**
     * Set the minimum log level
     * @param level - One of: DEBUG, INFO, WARN, ERROR
     */
    static SetLevel(level) {
        if (this.Levels.Has(level)) {
            this.CurrentLevel := this.Levels[level]
        }
    }

    /**
     * Log a debug message
     * @param msg - Message to log
     */
    static Debug(msg) {
        this.Write("DEBUG", msg, 0)
    }

    /**
     * Log an info message
     * @param msg - Message to log
     */
    static Info(msg) {
        this.Write("INFO", msg, 1)
    }

    /**
     * Log a warning message
     * @param msg - Message to log
     */
    static Warn(msg) {
        this.Write("WARN", msg, 2)
    }

    /**
     * Log an error message
     * @param msg - Message to log
     */
    static Error(msg) {
        this.Write("ERROR", msg, 3)
    }

    /**
     * Internal write method
     */
    static Write(level, msg, levelValue) {
        if (levelValue >= this.CurrentLevel) {
            timestamp := FormatTime(A_Now, "yyyy-MM-dd HH:mm:ss")
            logLine := Format("[{1}] [{2}] {3}`n", timestamp, level, msg)

            try {
                FileAppend logLine, this.LogFile
            } catch Error as e {
                MsgBox "Failed to write to log file: " e.Message
            }
        }
    }

    /**
     * Clear the log file
     */
    static Clear() {
        try {
            FileDelete this.LogFile
        }
    }

    /**
     * Get log file path
     * @returns Full path to log file
     */
    static GetPath() {
        return this.LogFile
    }
}
