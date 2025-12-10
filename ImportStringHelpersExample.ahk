#Requires AutoHotkey v2.1-alpha.17
#SingleInstance Force

; Example string helper module mirroring the structure expected by the toolbox.

#Module StringHelpers

export TitleCase(text) {
    words := StrSplit(text, ' ')
    for index, word in words {
        words[index] := word.Length
            ? StrUpper(SubStr(word, 1, 1)) . StrLower(SubStr(word, 2))
            : ''
    }
    result := ''
    for index, word in words {
        result .= (index > 1 ? ' ' : '') . word
    }
    return result
}

export Slugify(text) {
    cleaned := RegExReplace(text, '[^\w\s-]', '')
    cleaned := RegExReplace(cleaned, '\s+', '-')
    return StrLower(Trim(cleaned, '-'))
}

export Pad(text, length, padChar := ' ') {
    if StrLen(text) >= length {
        return text
    }
    needed := length - StrLen(text)
    return text . StrRepeat(padChar, needed)
}

export default BuildLabel(text) {
    return Map(
        'title', TitleCase(text),
        'slug', Slugify(text),
        'padded', Pad(text, 20, '.')
    )
}
