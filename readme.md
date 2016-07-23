# signature-js

signature-js is a utility library to aid in resolving overloaded function signatures in javascript. It provides a simple form of pattern matching to resolve default arguments for a function and throws an invalid argument exception if the arguments given do not match.

```
npm install typescript -g
tsc signature.ts
```

```javascript
// overloaded method.
const method = signature()
    .map(["string"],           (message)     => [200, message])
    .map(["number", "string"], (id, message) => [id,  message])
    .into((id, message) => {
        console.log(id, message)
    })

method("hello world")    // ok
method(404, "not found") // ok
method(1)                // nope
```

## matching types

The following types can be passed to a signature's map() function.

```
type:            matched:
------------------------------
any          ->  [any value]
undefined    ->  undefined
null         ->  null
function     ->  function() { }
string       ->  hello world
number       ->  500
boolean      ->  true
date         ->  new Date()
array        ->  []
object       ->  {}
``` 
### example

```javascript
let method = signature()
    .map(["string"])  // defaults: [str] -> [str]
    .map(["number"],           (a)    => ["number " + a.toString()] )
    .map(["number", "number"], (a, b) => [a.toString() + " and " + b.toString()])
    .map(["object"],           (a)    => [JSON.stringify(a)])
    .into(str => { 
        console.log(str)
    })

method("hello")   // hello
method(32, 64)    // 32 and 64
method(42)        // number 42
method({a: 10})   // {"a": 10}

method(undefined) // nope (see below)
```

## union types

signature-js supports union types, which are a combination of any of the above types. Union
types are seperated by a | character. When using unions, the map() function becomes responsible
for resolving the type, and mapping it accordingly.

```
union type:                  matched:
---------------------------------------------
string | number              500   or "hello"
object | undefined           ()    or undefined
null   | undefined           null  or undefined
string | array | null        "hello" or [] or null
```

### example
The following example extends the previous to support passing null or undefined
values. for convenience, we map null and undefined as a union.

```javascript
let method = signature()
    .map(["string"])
    .map(["number"],           (a)    => ["number " + a.toString()] )
    .map(["number", "number"], (a, b) => [a.toString() + " and " + b.toString()])
    .map(["object"],           (a)    => [JSON.stringify(a)])
    .map(["null | undefined"], (a)    => ["no value"])
    .into(str => {
        console.log(str)
    })

method(undefined) // no value
method(null)      // no value
```