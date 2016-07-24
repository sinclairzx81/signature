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
 * SignatureFunction:
 * provides function signature validation services
 * for javascript function.
 */
export interface SignatureFunction {
    /**
     * invokes this signature.
     * @param {...args: any[]} the arguments array.
     * @returns {any}
     */
    (...args: any[]) : any
    /**
     * creates a default mapping for the given typenames.
     * @param {Array<string>} an array of types that can be called on this signature.
     * @returns {SignatureFunction}
     */
    map (typenames: Array<string>) : SignatureFunction

    /**
     * creates a custom mapping for the given typenames. the
     * mapping function will receive the values given by the caller,
     * and s responsible for mapping each value into the appropriate
     * type.
     * @param {Array<string>} an array of type names that map can be called on this signature.
     * @param {(...args: any[]) => Array<any>} the mapping function.
     * @returns {SignatureFunction}
     */
    map (typenames: Array<string>, fn: (...args: any[]) => Array<any>) : SignatureFunction
    
    /**
     * specifies the implementation of this signature.
     * @param {(...args: any[]) => any} the signature implementation.
     * @returns {any}
     */
    into(fn: (...args: any[]) => any) : SignatureFunction
}

/**
 * creates a new method signature.
 * @returns {SignatureFunction}
 */
export function signature() : SignatureFunction {
    
    type TypeId = "undefined" | 
                  "null" | 
                  "function" | 
                  "string" | 
                  "number" | 
                  "boolean" | 
                  "date" | 
                  "array" | 
                  "object"

    interface Mapping { types  : Array<string>, fn: (...args: any[]) => Array<any> }

    /**
     * the mappings for this signature.
     */
    const mappings = new Array<Mapping>()
    /**
     * the into function.
     */
    const funcs     = new Array<(...args: any[]) => any>()

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

    /**
     * creates this mapping for signature.
     * @param {Array<string>} the types accepted by this signature.
     * @param {(Array<any>) : Array<any>} the mapping function.
     * @returns {Func}
     */
    const map = (types: Array<string>, fn: (...args: any[]) => Array<any>) : SignatureFunction => {
        if(fn === undefined) fn = (...args: any[]) => args
        for(let i = 0; i < mappings.length; i++) {
            if(compare_type_array(mappings[i].types, types)) {
                throw Error("ambiguous signature mapping detected.")
            }
        } mappings.push({types: types, fn: fn})
        return self as SignatureFunction
    }
    
    /**
     * inserts a implementation for this signature.
     * @param {(...args): any} the implementation.
     * @returns {Func}
     */
    const into = (fn: (...args: any[]) => any) : SignatureFunction => {
        if(funcs.length === 0) funcs.push(fn)
        else throw Error("signature can only have a single implementation.")
        return self as SignatureFunction
    }

    /**
     * invokes this signature.
     * @param {...args: any[]} arguments passed to this function.
     * @returns {any}
     */
    function execute(...args: any[]) : any {
        let param = match(args)
        if(param === undefined)
            throw Error("invalid argument error.")
        if(funcs.length === 0)
            throw Error("this signature has no implementation.")
        return funcs[0].apply({}, param)
    }
    /**
     * packages up self, returns to caller.
     */
    const self = <any>execute
    self.map  = map
    self.into = into
    return self as SignatureFunction
}