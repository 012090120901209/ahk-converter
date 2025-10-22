#Requires AutoHotkey v2.1-alpha.17
; Test file for enhanced function metadata extraction

; Function with various parameter types
TargetFunction(p1, p2 := "default", &p3 := "", p4 := Random(1, 6), p5?, *rest) => String {
    static a, b := 10, c := "initialized"
    d := e := f := 0
    local g, h
    global i
}

; Function with type hints
TypedFunction(name: String, count: Integer := 5, &result: Array?) {
    static cache := Map()
    items := []
}

; Function with optional parameters
OptionalParams(required, optional1?, optional2 := "fallback") {
    static initialized := false
}

; Function with only expressions as defaults
ExpressionDefaults(arr := [], obj := {}, calc := 2 + 2, rnd := Random(1, 100)) {
    static counter := 0
}

; Simple function
SimpleFunc(x, y) {
    return x + y
}

; Variadic function
VariadicFunc(first, *args) {
    for arg in args
        MsgBox(arg)
}
