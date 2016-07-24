# signature-js

overloaded function signatures in javascript.

signature-js is a utility library that provides runtime type validation services
for javascript functions. Useful for typescript authored modules requiring dynamic
type checking when consumed from javascript.

```javascript
const method = signature()
method.map([], () => ["nothing", "nothing"])
method.map(["string", "string"])            
method.into((a, b) => {
    console.log(a, b)
}) 
method()                 // ok
method("hello", "world") // ok
method("hello")          // fail
method(1, 2)             // fail
```
## build
```
npm install typescript -g
tsc signature.ts
```

## rational

TypeScript is a great language that provides robust compile time type checking, but offers 
little in the way of ensuring that a typescript function will be passed the correct types at 
runtime. This is especially true for typescript authored modules being consumed by javascript,
where the caller is free to pass any type at all, potentially leading to undefined behaviour.

As a general rule, developers should always validate their inputs, but for the typescript developer,
having to manually implement a secondary form of type checking over the top of the static type 
system is always awkward. 

In addition, authoring overloaded type signatures in either typescript or javascript can be error
prone, again forcing the developer to validate the types given on a javascript arguments array.

signature-js aims to simplify runtime type validation of function arguments and 
provide a scheme for overloading functions that doesn't feel too out of place
in the typescript language.

## usage

signature-js works by wrapping a javascript function in a closure which contains
type mappings for arguments that function can accept. signature-js madates
that the signature specify the expected types the signature should expect, and
a function body.

```javascript
// non validated
const method = () => {
    console.log("hello world")
}

// validated
const method = signature()
method.map([]) // we expect no arguments.
method.into(() => {
    console.log("hello world!")
})

method()    // hello world!
method(123) // invalid argument error
```

## types
signature-js supports the following javascript types, these
types are given to a signature as a string array on map().
when the signature is invoked, the arguments passed at matched
against the following table.

```
type       | matches on
--------------------------------
any        | {} or [] or 123 or true.. etc
undefined  | undefined 
null       | null
function   | function() {} or () => {}
string     | "hello"
number     | 1, 2, 3 
boolean    | true or false
date       | Date()
array      | []
object     | {}
```
note: signature-js treats null and undefined as distinct
types in line with future revisions of the typescript 
compiler. callers need to "opt in" to allow a signature
to accept either of these. 

note: the any type will accept any javascript value.

## type mapping
A signature can contain any number of type mappings so long
as each mapping does not introduce ambiguity. See section on 
ambiguous signatures for more info.

The following creates a function that can accept a variety 
of arguments. A key principle with signature-js is that each 
mapping function should map multiple overloads into a single 
argument list.

```javascript
//---------------------------------
// a function sums two numbers.
//---------------------------------
const sum = signature()
sum.map(["number", "number"]) 
sum.map(["number", "number", "number"], (a, b, c) => [a, b + c])
sum.map(["string", "string"], (a, b) => [parseInt(a), parseInt(b)])
sum.map(["array"],            (a) =>    [0, a.reduce((acc, c) => acc + c, 0)])
sum.into((a, b) => a + b)

console.assert( sum(10, 20)       === 30)
console.assert( sum(10, 20, 30)   === 60)
console.assert( sum("100", "200") === 300)
console.assert( sum([100, 200, 300]) === 600)
```
note: in this example, the map() function should assume the role of 
mapping the given arguments into the correct type. The above string
and array mapping "should" be type checked also. This is not done
here. Future revisions of signature-js may runtime array checking.

## typescript overloading

The following takes the above example, and creates typescript compatiable
overloads.
```typescript
// typescript overloads for the sum function.
interface SumFunction extends SignatureFunction {
    (a: number, b: number) : number
    (a: number, b: number, c: number): number
    (a: string, b: string) : number
    (a: Array<number>): number
}

// create sum function, cast to interface
const sum = signature()
.map(["number", "number"]) 
.map(["number", "number", "number"], (a, b, c) => [a, b + c])
.map(["string", "string"],           (a, b) => [parseInt(a), parseInt(b)])
.map(["array"],                      (a) => [0, a.reduce((acc, c) => acc + c, 0)])
.into((a, b) => a + b) as SumFunction // cast to overload.

```
## ambiguous signatures
signature-js provides some level of protection by preventing multiple
map() arguments from conflicting. 

```
let a = signature()
    .map("string")
    .map("number", s => s.toString()) // ok

let b = signature()
    .map("string")
    .map("any", s => s.toString()) // ambiguous
```

## when to use this library

Converting every function is your library into a signature is not practical.

signature-js was primarily written to mediate the boundary between
typescript and javascript, ensuring that a javascript consumer of a typescript
module was passing correct values from their non type checked environment.

```
     unsafe         safe
+--------------|--------------+
|              |              |
|  javascript  >  typescript  |
|              |              |
+--------------|--------------+
    module     |    module
               |
            boundary
```
Where signature would layer the typescript module behind as follows.
```
     unsafe                safe
+--------------|--------------------+
|              |  s  |              |
|  javascript  >  i  >  typescript  |
|              |  g  |              |
+--------------|--------------------+
    module               module
            boundary
           
```
From a typescript perspective, if authoring a typescript library that is expected
to be consumed from a javascript client, you can use signature-js to validate
any exported (publically accessable) function exposed to javascript. For everything
else, trust in the typescript compilers static type checking.