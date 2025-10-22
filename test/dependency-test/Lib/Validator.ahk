#Requires AutoHotkey v2.0
; Validation library

class Validator {
    static Check(obj) {
        if !IsObject(obj) {
            return false
        }

        return obj.Has("appName") && obj.Has("version")
    }
}
