# Zero-dep Electron App

Write full TypeScript support Electron app with 0 kB node_modules.

## Setup

1. Install Node.js 22+, then `npm i -g electron` (this repo contains no Electron binary)
2. Run `npm install` to fetch types for better DX (optional, can also use `bun run --bun install`)
3. Run `electron .` to give it a try

### Guide without Node.js or Bun (only one Electron)

1. Install Electron to global scope, for example download one from [GitHub releases](https://github.com/electron/electron/releases)
2. Set a shell command alias named `node` as `ELECTRON_RUN_AS_NODE=1 electron`\
   Windows users can use `build\node.cmd`, for example, `build\node …`
3. Run `node build/install.ts` (Windows `build\node build\install.ts`) to fetch types for better DX (optional)
4. Run `electron .` to give it a try

## How

Node.js supports run TypeScript files natively since 22.18. Electron bundles Node.js,
which enables it to run TypeScript files too. For front-end files, we can register
a new file protocol and intercept local resources to transpile TypeScript files,
using [`module.stripTypeScriptTypes`](https://nodejs.org/api/module.html#modulestriptypescripttypescode-options).

The only one file on the disk not in TypeScript is the preload script. It must be a normal js file.
We can transpile one and write to the js file when start electron.

Type checking and code formatting should be directly handled by your code editors.
For example you can enable these options in your VS Code (there's a more complicated [one](https://github.com/hyrious/dotfiles/blob/main/.vscode/settings.json)):

<details><summary>VS Code settings.json</summary>

```jsonc
"files.insertFinalNewline": true,
"files.trimTrailingWhitespace": true,
"typescript.format.semicolons": "insert",
"typescript.preferences.quoteStyle": "single",
"typescript.preferences.importModuleSpecifier": "relative",
"typescript.preferences.importModuleSpecifierEnding": "js",
"[typescript]": {
  "editor.defaultFormatter": "vscode.typescript-language-features",
  "editor.formatOnSave": true
},
"[javascript]": {
  "editor.defaultFormatter": "vscode.typescript-language-features",
  "editor.formatOnSave": true
},
```

</details>

### Caveats

- Code style is more strict.

  Since we are not using any other TypeScript transpiler/bundler tools.
  We have to write TypeScript in the style of `erasableSyntaxOnly` mode in both frontend and backend.

  This does not mean we can not use any frontend libraries: We can intercept any web requests
  from the main process and serve correct ESM files. We could even make Vite happen through the
  custom protocol in Electron.

## License

MIT @ [hyrious](https://github.com/hyrious)
