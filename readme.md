# signature-js

signature-js is a utility library to aid in resolving overloaded function 
signatures in javascript. It provides a simple form of pattern matching
to resolve default arguments for a function and throws an invalid argument
exception if the arguments given do not match.

```
npm install typescript -g
tsc signature.ts
```

### example

The following demonstrates an example usage of the library. Here,
we have some pseudo api with a connect() method we wish to overload. 

All arguments (host, port and timeout) are required, but only
the port argument is mandatory, the host and timeout arguments 
can be given reasonable default values.

```javascript
/**
 * creates a connection to the given endpoint.
 * @param {string} the host to connect to.
 * @param {number} the port to connect to.
 * @param {number} the timeout in milliseconds.
 * @returns {Connection}
 */
export function connect (host: string, port: number, timeout: number) : Connection

/**
 * creates a connection to the given endpoint with a default timeout of 1000ms.
 * @param {string} the host to connect to.
 * @param {number} the port to connect to.
 * @returns {Connection}
 */
export function connect (host: string, port: number)  : Connection

/**
 * creates a connection to localhost with a default timeout of 1000ms.
 * @param {number} the port to connect to.
 * @returns {Connection}
 */
export function connect (port: number)  : Connection

/**
 * creates a connection.
 * @param {any[]} arguments
 * @returns {Connection}
 */
export function connect (...args: any[]) : Connection {
  let param = signature(args, [
      { pattern: ["string", "number", "number"], map : (args) => ({ 
          host   : args[0], 
          port   : args[1],
          timeout: args[2]  
      })},
      { pattern: ["string", "number"], map : (args) => ({ 
          host   : args[0], 
          port   : args[1],
          timeout: 1000  
      })},
      { pattern: ["number"], map : (args) => ({ 
          host   : "localhost", 
          port   : args[0],
          timeout: 1000
      })}
  ])
  
  console.log(param.host, 
              param.port, 
              param.timeout)
}
```
