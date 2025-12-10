#Requires AutoHotkey v2.1-alpha.17
#SingleInstance Force

; Example array helper module that can be imported by scripts or tests.

#Module ArrayHelpers

export Sum(numbers) {
    total := 0
    for value in numbers {
        total += value
    }
    return total
}

export Average(numbers) {
    if numbers.Length = 0 {
        return 0
    }
    return Sum(numbers) / numbers.Length
}

export Normalize(numbers) {
    result := []
    max := 0
    for value in numbers {
        if value > max {
            max := value
        }
    }
    for value in numbers {
        result.Push(max ? Round(value / max, 2) : 0)
    }
    return result
}

export default BuildArrayReport(numbers) {
    return Map(
        'count', numbers.Length,
        'sum', Sum(numbers),
        'average', Average(numbers),
        'normalized', Normalize(numbers)
    )
}
