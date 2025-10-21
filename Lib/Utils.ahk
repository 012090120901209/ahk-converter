#Requires AutoHotkey v2.0
; Utils library
; Contains utility functions

StrJoin(arr, delimiter := ", ") {
    result := ""
    for item in arr {
        result .= (A_Index > 1 ? delimiter : "") . item
    }
    return result
}

ArrayContains(arr, value) {
    for item in arr {
        if (item = value) {
            return true
        }
    }
    return false
}
