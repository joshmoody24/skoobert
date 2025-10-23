# Skoobert

A **lazy subset of JavaScript** - expressions are only evaluated when their values are actually needed.

## Features

- **JavaScript subset** with familiar syntax
- **Lazy evaluation** with automatic memoization

## Playground

<a href="https://joshmoody24.github.io/skoobert/" target="_blank">Run Skoobert in the browser</a>

## Installation

`npm install skoobert`

[skoobert npm Package](https://www.npmjs.com/package/skoobert)

## Usage

```typescript
import { parse, interpret } from "skoobert";

// Basic usage with default console output
const ast = parse("let x = 42; console.log(x);");
interpret(ast);

// Custom output handler
interpret(ast, {
  onOutput: (value) => console.log("Custom:", value),
});
```

## Lazy Evaluation Examples

```javascript
// Infinite recursion is safe when not used
let loop = (x) => loop(x);
let first = (a) => (b) => a;
console.log(first(100)(loop(0))); // ✅ Outputs: 100 (loop never executes)

// The Y combinator works directly without needing a wrapper!
// (This crashes in regular JavaScript due to eager evaluation)
let Y = (f) => ((x) => f((v) => x(x)(v)))((x) => f((v) => x(x)(v)));

let factorial = Y((f) => (n) => (n <= 1 ? 1 : n * f(n - 1)));
console.log(factorial(5)); // ✅ Outputs: 120
```

## Language Syntax

```javascript
// Variable declarations
let message = "Hello, World!";
let number = 42;
let flag = true;

// Arithmetic with proper precedence
let result = 2 + 3 * 4; // 14

// Logical operations
let check = 5 > 3 && 2 < 4; // true

// Arrow functions
// (Must take exactly one argument)
let double = (x) => x * 2;
let add = (x) => (y) => x + y;

// Console output
console.log(result);
```

## Development

```bash
npm run build    # Type check, lint, and compile
npm run test     # Run all tests
npm run format   # Format code with Prettier
```

## License

MIT
