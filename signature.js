/*--------------------------------------------------------------------------

signature-js - overloaded function signatures in javascript.

The MIT License (MIT)

Copyright (c) 2016 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/
"use strict";
/**
 * creates a new signature.
 * @returns {Signature<T>}
 */
exports.signature = function () {
    var mappings = new Array();
    /**
     * reflects the given type, returning its simple typename.
     * @param {any} the object to reflect.
     * @returns {TypeName}
     */
    var reflect = function (obj) {
        if (obj === undefined)
            return "undefined";
        if (obj === null)
            return "null";
        if (typeof obj === "function")
            return "function";
        if (typeof obj === "string")
            return "string";
        if (typeof obj === "number")
            return "number";
        if (typeof obj === "boolean")
            return "boolean";
        if (typeof obj === "object") {
            if (obj instanceof Array)
                return "array";
            if (obj instanceof Date)
                return "date";
        }
        return "object";
    };
    /**
     * compares a union type to another union type.
     * @param {string} the union type a.
     * @param {string} the union type b.
     * @returns {boolean} true if they match.
     */
    var compare_type = function (left, right) {
        var a = left.split("|").map(function (type) { return type.trim(); }).filter(function (type) { return type.length > 0; });
        var b = right.split("|").map(function (type) { return type.trim(); }).filter(function (type) { return type.length > 0; });
        if (a.indexOf("any") !== -1)
            return true;
        if (b.indexOf("any") !== -1)
            return true;
        for (var i = 0; i < a.length; i += 1) {
            for (var j = 0; j < b.length; j += 1) {
                if (a[i] === b[j])
                    return true;
            }
        }
        return false;
    };
    /**
     * compares the given type arrays for equality.
     * @param {Array<string>} the left type array.
     * @param {Array<string>} the right type array.
     * @returns {boolean}
     */
    var compare_type_array = function (left, right) {
        if (left.length !== right.length)
            return false;
        for (var i = 0; i < left.length; i += 1) {
            if (compare_type(left[i], right[i]) === false)
                return false;
        }
        return true;
    };
    /**
     * matches the given arguments against this
     * signatures internal mappings. returned undefined
     * if not found.
     * @param {any[]} the arguments array.
     * @returns {Array<any> | undefined}
     */
    var match = function (args) {
        var types = args.map(function (arg) { return reflect(arg); });
        for (var i = 0; i < mappings.length; i++) {
            if (compare_type_array(types, mappings[i].types)) {
                return mappings[i].fn.apply({}, args);
            }
        }
        return undefined;
    };
    var self = { map: map, into: into };
    /**
     * creates a signature mapping for the given type names.
     * @param {Array<string>} the types to match.
     * @param {(...args: any[]) => T} optional mapping function.
     * @returns {Signature<T>}
     */
    function map(types, fn) {
        if (fn === undefined)
            fn = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i - 0] = arguments[_i];
                }
                return args;
            };
        for (var i = 0; i < mappings.length; i++) {
            if (compare_type_array(mappings[i].types, types)) {
                var left = "[" + types.join(", ") + "]";
                var right = "[" + mappings[i].types.join(", ") + "]";
                var message = [left, right].join(' and ');
                throw Error("ambiguous mapping detected between " + message);
            }
        }
        mappings.push({ types: types, fn: fn });
        return self;
    }
    /**
     * returns a function that wraps the given function such
     * that, when called, passes through this signatures
     * type validation.
     * @param (...args: any[]) the function to wrap.
     * @returns {SignatureFunc<U>}
     */
    function into(fn) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var param = match(args);
            if (param === undefined)
                throw Error("invalid argument.");
            return fn.apply({}, param);
        };
    }
    return self;
};
