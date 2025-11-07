#Module StringUtils

/**
 * String utility functions for AHK v2
 */

/**
 * Pad a string to a specified length
 * @param str - The string to pad
 * @param length - Target length
 * @param char - Character to pad with (default: space)
 * @returns Padded string
 */
StrPad(str, length, char := " ") {
    while (StrLen(str) < length) {
        str .= char
    }
    return str
}

/**
 * Truncate a string to maximum length
 * @param str - The string to truncate
 * @param maxLen - Maximum length
 * @param suffix - Suffix to add when truncated (default: "...")
 * @returns Truncated string
 */
StrTrunc(str, maxLen, suffix := "...") {
    if (StrLen(str) <= maxLen) {
        return str
    }
    return SubStr(str, 1, maxLen - StrLen(suffix)) . suffix
}

/**
 * Reverse a string
 * @param str - The string to reverse
 * @returns Reversed string
 */
StrReverse(str) {
    result := ""
    Loop Parse str {
        result := A_LoopField . result
    }
    return result
}

/**
 * Check if string contains only digits
 * @param str - The string to check
 * @returns True if string contains only digits
 */
IsNumericString(str) {
    return RegExMatch(str, "^\d+$") > 0
}

/**
 * Capitalize first letter of each word
 * @param str - The string to capitalize
 * @returns Title-cased string
 */
ToTitleCase(str) {
    result := ""
    Loop Parse str, " " {
        word := A_LoopField
        if (word != "") {
            result .= (result != "" ? " " : "") . StrUpper(SubStr(word, 1, 1)) . StrLower(SubStr(word, 2))
        }
    }
    return result
}
