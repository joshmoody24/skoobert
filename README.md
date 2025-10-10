# Skoobert

A **lazy subset of JavaScript** - expressions are only evaluated when their values are actually needed.

## Features

- **Lazy evaluation** with automatic memoization
- **Variable declarations** with `let`
- **Arrow functions** (`x => x + 1`)
- **Arithmetic** and **logical operators**
- **Console output** with injectable handlers

## Quick Start

```bash
npm install
npm test
```

## Usage

```typescript
import { parse, interpret } from 'skoobert';

// Basic usage with default console output
const ast = parse('let x = 42; console.log(x);');
interpret(ast);

// Custom output handler
interpret(ast, {
  onOutput: (value) => console.log('Custom:', value)
});
```

## Lazy Evaluation Examples

```javascript
// This won't cause division by zero because x is never used
let x = 1 / 0;
let y = 42;
console.log(y); // ✅ Outputs: 42

// Short-circuiting - second expression never evaluated
console.log(true || 1 / 0); // ✅ Outputs: true

// Functions receive lazy arguments
let f = x => 42;
console.log(f(1 / 0)); // ✅ Outputs: 42 (argument never evaluated)
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
let double = x => x * 2;
let add = x => y => x + y;

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