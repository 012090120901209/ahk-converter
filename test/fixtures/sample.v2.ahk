; AutoHotkey v2 Sample File for Testing
#Requires AutoHotkey v2.0

SimpleFunction() {
  return "test"
}

FunctionWithParams(name, count := 5, text := "default") {
  return text
}

ByRefFunction(&param1, param2) {
  param1 := "modified"
  return param2
}

OptionalParams(required, optional?) {
  if IsSet(optional) {
    return required . optional
  }
  return required
}

TypedFunction(name: String, count: Integer) => String {
  return name . " " . count
}

VariadicFunc(required, params*) {
  total := required
  for item in params {
    total += item
  }
  return total
}

ComplexDefaults(str := "text", num := 42, expr := Random(1, 10), unsetVal := unset) {
  return str . num
}

FunctionWithVariables() {
  static counter := 0
  static initialized, name := "test"
  
  a := b := c := 0
  x := "value"
  
  counter++
  return counter
}

MyClass {
  __New(name) {
    this.name := name
  }
  
  GetName() {
    return this.name
  }
  
  static StaticMethod() {
    return "static"
  }
}
