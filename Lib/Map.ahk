/**
 * @typedef {Object} MonitorRect
 * @property {Integer} left   Left coordinate of monitor rectangle
 * @property {Integer} top    Top coordinate of monitor rectangle
 * @property {Integer} right  Right coordinate of monitor rectangle
 * @property {Integer} bottom Bottom coordinate of monitor rectangle
 */

/**
 * @class Window
 * @description Utilities for working with windows and monitors.
 *
 * Quick API map (shows in hover/outline):
 * @property {String} activeTitle    Last known active window title (may be empty)
 * @property {Integer} lastRetries   Internal retry counter used by SendToMonitor
 *
 * Short method list (signature map)
 * @method static GetActiveWindow() : String|Integer
 * @method static GetCurrentMonitor(WinTitle?: String) : Integer
 * @method static SendToMonitor(Index?: Integer|String, WindowTitle?: String) : Void
 *
 * @example
 * title := Window.GetActiveWindow()
 * Window.SendToMonitor(2, title)
 */
class Map2 {
    static __New() => (Map2.base := Map.Prototype.base, Map.Prototype.base := Map2)
    /**
     * Returns all the keys of the Map in an array
     * @returns {Array}
     */
    static Keys {
        get => [this*]
    }
    /**
     * Returns all the values of the Map in an array
     * @returns {Array}
     */
    static Values {
        get => [this.__Enum(2).Bind(&_)*]
    }

    /**
     * Applies a function to each element in the map (mutates the map).
     * @param func The mapping function that accepts at least key and value (key, value1, [value2, ...]).
     * @param enums Additional enumerables to be accepted in the mapping function
     * @returns {Map}
     */
    static Map(func, enums*) {
        if !HasMethod(func)
            throw ValueError("Map: func must be a function", -1)
        for k, v in this {
            bf := func.Bind(k,v)
            for _, vv in enums
                bf := bf.Bind(vv.Has(k) ? vv[k] : unset)
            try bf := bf()
            this[k] := bf
        }
        return this
    }
    /**
     * Applies a function to each key/value pair in the map.
     * @param func The callback function with arguments Callback(value[, key, map]).
     * @returns {Map}
     */
    static ForEach(func) {
        if !HasMethod(func)
            throw ValueError("ForEach: func must be a function", -1)
        for i, v in this
            func(v, i, this)
        return this
    }
    /**
     * Keeps only values that satisfy the provided function
     * @param func The filter function that accepts key and value.
     * @returns {Map}
     */
    static Filter(func) {
        if !HasMethod(func)
            throw ValueError("Filter: func must be a function", -1)
        r := Map()
        for k, v in this
            if func(k, v)
                r[k] := v
        return this := r
    }
    /**
     * Finds a value satisfying the provided function and returns its key.
     * @param func The condition function that accepts one argument (value).
     * @param match Optional: is set to the found value
     * @example
     * Map("a", 1, "b", 2, "c", 3).Find((v) => (Mod(v,2) == 0)) ; returns "b"
     */
    static Find(func, &match?) {
        if !HasMethod(func)
            throw ValueError("Find: func must be a function", -1)
        for k, v in this {
            if func(v) {
                match := v
                return k
            }
        }
        return 0
    }
    /**
     * Counts the number of occurrences of a value
     * @param value The value to count. Can also be a function that accepts a value and evaluates to true/false.
     */
    static Count(value) {
        count := 0
        if HasMethod(value) {
            for _, v in this
                if value(v?)
                    count++
        } else
            for _, v in this
                if v == value
                    count++
        return count
    }
    /**
     * Adds the contents of other enumerables to this one.
     * @param enums The enumerables that are used to extend this one.
     * @returns {Array}
     */
    static Merge(enums*) {
        for i, enum in enums {
            if !HasMethod(enum, "__Enum")
                throw ValueError("Extend: argument " i " is not an iterable")
            for k, v in enum
                this[k] := v
        }
        return this
    }
}
