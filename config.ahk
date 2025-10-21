#Requires AutoHotkey v2.0
; Configuration settings

class Config {
    static AppName := "AHK Dependency Test"
    static Version := "1.0.0"
    static Debug := true

    static GetSetting(key, default := "") {
        ; Read from INI or registry
        return default
    }
}
