#Requires AutoHotKey v2.0-beta.1
; CONVERSION-STATUS: SUCCESS - AutoHotkey v2 Compatible
; This file has been successfully converted to AutoHotkey v2 syntax
; All legacy v1 syntax has been updated to v2 standards



/* a list of all renamed Array Methods, in this format:
  a method has the syntax Array.method(Par1, Par2)
    , "OrigV1Method" ,
      "ReplacementV2Method"
    ? first comma is not needed for the first pair
  Similar to commands, parameters can be added
*/

global ArrayMethodsToConvertM := OrderedMap(
    "length()" ,
    "Length"
  , "HasKey(Key)" ,
    "Has({1})"
  )

