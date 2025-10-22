#Requires AutoHotkey v2.0
; Configuration loader

#Include <Validator>

LoadConfig() {
    config := Map()
    config["appName"] := "Test App"
    config["version"] := "1.0.0"

    if !Validator.Check(config) {
        MsgBox("Invalid configuration")
    }

    return config
}
