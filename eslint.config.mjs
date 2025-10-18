
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

// https://eslint.org/docs/latest/use/configure/
export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,md}"],

    // Start with the recommended base rules from ESLint
    extends: [js.configs.recommended],

    languageOptions: {
      ecmaVersion: "latest", // Use the latest ECMAScript features
      sourceType: "commonjs", // Your project uses CommonJS modules
      globals: {
        ...globals.node, // Enable Node.js global variables
        ...globals.jest, // Enable Jest global variables for test files
      },
    },

    // Add your custom rules here
    rules: {
      // --- Style and Formatting ---

      // Enforce no semicolons at the end of statements
      "semi": ["error", "never"],

      // Enforce 2-space indentation
      "indent": ["error", 2],

      // Enforce single quotes for strings
      "quotes": ["error", "single"],

      // Require trailing commas for multiline arrays and objects
      "comma-dangle": ["error", "always-multiline"],

      // Disallow trailing whitespace at the end of lines
      "no-trailing-spaces": "error",


      // --- Best Practices & Code Quality ---

      // Require the use of `===` and `!==` instead of `==` and `!=`
      "eqeqeq": "error",

      // Disallow the use of `var`; require `let` or `const` instead
      "no-var": "error",

      // Suggest using `const` for variables that are never reassigned
      "prefer-const": "error",

      // Warn about unused variables, but allow unused function arguments that start with an underscore
      // This is useful for Express middleware like `(req, res, _next) => { ... }`
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],

      // Warn about the use of `coeslinsole.log`, `console.warn`, etc.
      // "no-console": "warn",
      // Disallow more than one consecutive empty line
      "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 0 }],

      // Enforce padding lines between statements for readability
      "padding-line-between-statements": [
        "error",
        // Always require a blank line AFTER a block of variable declarations
        { blankLine: "always", prev: ["const", "let"], next: "*" },
        // But don't require it if the next statement is also a variable declaration
        { blankLine: "any", prev: ["const", "let"], next: ["const", "let"] },

        // Always require a blank line BEFORE and after a `return` statement
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "return", next: "*" },

        // Always require a blank line BEFORE and AFTER control structures
        { blankLine: "always", prev: "*", next: ["if", "for", "while", "switch", "try"] },
        { blankLine: "always", prev: ["if", "for", "while", "switch", "try"], next: "*" },
      ],
    },
  },
]);

