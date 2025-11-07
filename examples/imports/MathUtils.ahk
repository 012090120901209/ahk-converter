#Module MathUtils

/**
 * Mathematical utility functions for AHK v2
 */

/**
 * Clamp a number between min and max
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
Clamp(value, min, max) {
    if (value < min) {
        return min
    }
    if (value > max) {
        return max
    }
    return value
}

/**
 * Linear interpolation between two values
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor (0 to 1)
 * @returns Interpolated value
 */
Lerp(start, end, t) {
    return start + (end - start) * t
}

/**
 * Map a value from one range to another
 * @param value - Input value
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 */
MapRange(value, inMin, inMax, outMin, outMax) {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin))
}

/**
 * Calculate the average of an array of numbers
 * @param numbers - Array of numbers
 * @returns Average value
 */
Average(numbers) {
    sum := 0
    for num in numbers {
        sum += num
    }
    return sum / numbers.Length
}

/**
 * Find the minimum value in an array
 * @param numbers - Array of numbers
 * @returns Minimum value
 */
Min(numbers) {
    minVal := numbers[1]
    for num in numbers {
        if (num < minVal) {
            minVal := num
        }
    }
    return minVal
}

/**
 * Find the maximum value in an array
 * @param numbers - Array of numbers
 * @returns Maximum value
 */
Max(numbers) {
    maxVal := numbers[1]
    for num in numbers {
        if (num > maxVal) {
            maxVal := num
        }
    }
    return maxVal
}

/**
 * Calculate factorial of a number
 * @param n - Non-negative integer
 * @returns Factorial of n
 */
Factorial(n) {
    if (n <= 1) {
        return 1
    }
    result := 1
    Loop n {
        result *= A_Index
    }
    return result
}

/**
 * Check if a number is prime
 * @param n - Number to check
 * @returns True if prime, false otherwise
 */
IsPrime(n) {
    if (n <= 1) {
        return false
    }
    if (n <= 3) {
        return true
    }
    if (Mod(n, 2) = 0 || Mod(n, 3) = 0) {
        return false
    }

    i := 5
    while (i * i <= n) {
        if (Mod(n, i) = 0 || Mod(n, i + 2) = 0) {
            return false
        }
        i += 6
    }
    return true
}

/**
 * Calculate greatest common divisor
 * @param a - First number
 * @param b - Second number
 * @returns GCD of a and b
 */
GCD(a, b) {
    while (b != 0) {
        temp := b
        b := Mod(a, b)
        a := temp
    }
    return a
}

/**
 * Calculate least common multiple
 * @param a - First number
 * @param b - Second number
 * @returns LCM of a and b
 */
LCM(a, b) {
    return (a * b) / GCD(a, b)
}
