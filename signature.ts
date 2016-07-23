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

/**
 * SignatureFunc<TResult>
 * Function returned on a call to a signatures into() method.
 */
interface SignatureFunc<TResult> {
    (...args: any[]) : TResult
}

/**
 * Signature<T>
 * provides overloaded function type validation services.
 */
interface Signature<TResult> {
    /**
     * creates a default mapping on this signature. mapping
     * the types inputs into the function.
     * @param {Array<string>} the types to map.
     * @returns {Signature<TResult>}
     */
    map      (types: Array<string>) : Signature<TResult> 
    /**
     * creates a mapping for this signature, allowing the 
     * inputs to be mapped with the given mapping function.
     * @param {Array<string>} the types to map.
     * @param {(...args: any[]) => Array<any>} the mapping function.
     * @returns {Signature<TResult>}
     */
    map      (types: Array<string>, fn: (...args: any[]) => Array<any>) : Signature<TResult> 

    /**
     * creates a new function that proxies calls into the inner function.
     * Any calls made on the returned function will be type validated
     * and mapped prior to being passed into the inner function.
     * @param {(...args: any[]) => any} the function to wrap.
     * @returns {SignatureFunc<TResult>}
     */
    into     (fn: (...args: any[]) => any): SignatureFunc<TResult>
}

/**
 * creates a new signature.
 * @returns {Signature<T>}
 */
export const signature = <TResult>(): Signature<TResult> => {

    type TypeId = "undefined" | "null" | "function" | "string" | "number" | "boolean" | "date" | "array" | "object"

    interface Mapping {
        types  : Array<string>,
        fn     : (...args: any[]) => Array<any>
    }


    const mappings = new Array<Mapping>()

    /**
     * reflects the given type, returning its simple typename.
     * @param {any} the object to reflect.
     * @returns {TypeName}
     */
    const reflect = (obj: any): TypeId => {
        if (obj === undefined)         return "undefined"
        if (obj === null)              return "null"
        if (typeof obj === "function") return "function"
        if (typeof obj === "string")   return "string"
        if (typeof obj === "number")   return "number"
        if (typeof obj === "boolean")  return "boolean"
        if (typeof obj === "object") {
            if (obj instanceof Array)  return "array"
            if (obj instanceof Date)   return "date"
        } return "object"
    }

    /**
     * compares a union type to another union type.
     * @param {string} the union type a.
     * @param {string} the union type b.
     * @returns {boolean} true if they match.
     */
    const compare_type = (left: string, right: string) : boolean => {
        let a = left.split("|").map (type => type.trim()).filter(type => type.length > 0)
        let b = right.split("|").map(type => type.trim()).filter(type => type.length > 0)
        if(a.indexOf("any") !== -1) return true
        if(b.indexOf("any") !== -1) return true
        for(let i = 0; i < a.length; i+=1) {
            for(let j = 0; j < b.length; j+=1) {
                if(a[i] === b[j]) return true
            }
        } return false
    }
    /**
     * compares the given type arrays for equality.
     * @param {Array<string>} the left type array.
     * @param {Array<string>} the right type array.
     * @returns {boolean}
     */
    const compare_type_array = (left: Array<string>, right: Array<string>) : boolean => {
        if(left.length !== right.length) return false
        for(let i = 0; i < left.length; i+= 1) {
            if(compare_type(left[i], right[i]) === false)
                return false
        } return true
    }

    
    /**
     * matches the given arguments against this
     * signatures internal mappings. returned undefined
     * if not found.
     * @param {any[]} the arguments array.
     * @returns {Array<any> | undefined}
     */
    const match = (args: any[]) : Array<any> => {
        let types = args.map(arg => reflect(arg))
        for(let i = 0; i < mappings.length; i++) {
            if(compare_type_array(types, mappings[i].types)) {
                return mappings[i].fn.apply({}, args)
            }
        } return undefined 
    }


    const self     = {map, into}
    
    /**
     * creates a signature mapping for the given type names.
     * @param {Array<string>} the types to match.
     * @param {(...args: any[]) => T} optional mapping function.
     * @returns {Signature<T>}
     */
    function map(types: Array<string>, fn?:(...args: any[]) => Array<any>): Signature <TResult> {
        if(fn === undefined) fn = (...args: any[]) => args
        for(let i = 0; i < mappings.length; i++) {
            if(compare_type_array(mappings[i].types, types)) {
                let left    = "[" + types.join(", ") + "]"
                let right   = "[" + mappings[i].types.join(", ") + "]"
                let message = [left, right].join(' and ')
                throw Error("ambiguous mapping detected between " + message)
            }
        } mappings.push({types: types, fn: fn})
        return self
    }

    /**
     * returns a function that wraps the given function such 
     * that, when called, passes through this signatures
     * type validation.
     * @param (...args: any[]) the function to wrap.
     * @returns {SignatureFunc<U>}
     */
    function into (fn: (...args: any[]) => any) : SignatureFunc<TResult> {
        return (...args: any[]) : TResult => {
            let param = match(args)
            if(param === undefined)
                throw Error("invalid argument.")
            return fn.apply({}, param)
        }
    } 
    
    return self
}