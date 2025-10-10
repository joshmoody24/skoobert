# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Skoobert is a TypeScript implementation of a JavaScript-like language with **lazy evaluation**. Unlike standard JavaScript, expressions are only evaluated when their values are actually needed, implemented through a thunk-based system with memoization.

## Core Architecture

The interpreter follows a three-stage pipeline:

1. **Lexer** (`src/lexer/`) - Tokenizes source code into tokens defined in `src/types/tokens.ts`
2. **Parser** (`src/parser/`) - Builds an AST using enum-based node types from `src/types/ast.ts`
3. **Interpreter** (`src/interpreter/`) - Lazily evaluates the AST using thunks and environments

### Key Architectural Concepts

- **Lazy Evaluation**: Expressions are wrapped in "thunks" (closures that capture unevaluated expressions and their environments) and only evaluated when forced
- **Memoization**: Thunk results are cached to avoid re-evaluation
- **Environment Chain**: Variable scoping using linked environments with parent references
- **Injectable Output**: console.log is an injected dependency via `OutputHandler` interface for node/browser agnostic usage

### Important Type System Details

- All AST nodes use `NodeType` enum values instead of string literals
- Values are typed using `ValueType` enum (`Number`, `String`, `Boolean`, `Function`, `Thunk`)
- No `any` types are allowed in the codebase - use `{ type: unknown }` when needed
- The language does not support `undefined` values

## Essential Commands

```bash
# Development
npm test              # Run all tests with Vitest
npm run lint          # ESLint code analysis
npm run typecheck     # TypeScript type checking
npm run format        # Format code with Prettier
npm run check         # Run both typecheck and lint
npm run build         # Full build (check + compile)
npm run clean         # Remove dist directory

# Test specific files
npx vitest tests/lexer.test.ts
npx vitest tests/parser.test.ts
npx vitest tests/interpreter.test.ts
```

## Testing Architecture

Tests use Vitest with the following pattern:
- **Lexer tests**: Verify token generation and error handling for malformed input
- **Parser tests**: Check AST generation with both positive and negative cases
- **Interpreter tests**: Use mock `OutputHandler` functions to capture console.log output and verify lazy evaluation behavior

Critical: When testing interpreter functionality, always use the injectable `OutputHandler` pattern rather than mocking console.log directly.

## File Structure Significance

- `src/types/` - Core type definitions (AST nodes, tokens, values)
- `src/interpreter/values.ts` - Value types, environments, and thunk utilities
- `src/interpreter/force.ts` - Thunk evaluation and memoization logic
- `src/interpreter/evaluate.ts` - Main expression evaluation with lazy semantics

## Development Notes

- The build process requires passing both lint and typecheck before compilation
- Prettier formatting is enforced - all code should use `npm run format`
- When adding new language features, implement lexer → parser → interpreter in that order
- Always preserve lazy evaluation semantics - expressions should be wrapped in thunks when appropriate