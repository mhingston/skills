# LSP Server Catalog

The default 14-language catalog the `lsp-config-sync` skill uses for detection
and configuration. This file is the human-readable source of truth for
catalog edits; `scripts/detect-languages.mjs` embeds the same entries
inline so the detector is self-contained — **keep both in sync when you
add or change an entry**.

## Contents

- [Entry schema](#entry-schema)
- [Current catalog](#current-catalog-14-entries)
- [Adding an entry](#adding-an-entry--worked-example-elm)

## Entry schema

```ts
{
  key: string;              // stable, lowercase ASCII; merge-identity token
  displayName: string;      // human label, used in logs
  command: string;          // binary on PATH (e.g. "gopls")
  args: string[];           // CLI args to invoke the server
  fileExtensions: {          // ext (with dot, lowercase) -> LSP languageId
    ".go": "go",
    // ...
  };
  detectExtensions?: string[];   // defaults to Object.keys(fileExtensions)
  detectFileNames?: string[];    // exact filenames that trigger detection (case-insensitive)
  vscodeExtensions?: string[];   // VS Code Marketplace extension IDs to recommend
}
```

`key` rules: lowercase ASCII letters/digits/hyphens, never renamed once
shipped (would silently drop user settings). `displayName` is for logs
only — free-form. `fileExtensions` keys MUST be lowercase with leading
dot. Values are LSP `languageId` strings from the server's docs. If
`detectExtensions` is omitted, the detector uses all `fileExtensions` keys.

## Current catalog (14 entries)

### typescript — TypeScript / JavaScript

```yaml
key: typescript
displayName: TypeScript / JavaScript
command: typescript-language-server
args: ["--stdio"]
fileExtensions:
  .ts: typescript
  .tsx: typescriptreact
  .js: javascript
  .jsx: javascriptreact
  .mjs: javascript
  .cjs: javascript
  .mts: typescript
  .cts: typescript
detectExtensions: [.ts, .tsx, .js, .jsx, .mjs, .cjs, .mts, .cts]
vscodeExtensions: []   # TS/JS extensions are bundled with VS Code
```

### python — Python

```yaml
key: python
displayName: Python
command: pyright-langserver
args: ["--stdio"]
fileExtensions:
  .py: python
  .pyw: python
  .pyi: python
detectExtensions: [.py, .pyw, .pyi]
vscodeExtensions: [ms-python.python, ms-python.vscode-pylance]
```

### go — Go

```yaml
key: go
displayName: Go
command: gopls
args: ["serve"]
fileExtensions: { .go: go }
detectExtensions: [.go]
detectFileNames: [go.mod, go.work]
vscodeExtensions: [golang.go]
```

### rust — Rust

```yaml
key: rust
displayName: Rust
command: rust-analyzer
args: []
fileExtensions: { .rs: rust }
detectExtensions: [.rs]
detectFileNames: [cargo.toml]
vscodeExtensions: [rust-lang.rust-analyzer]
```

### java — Java

```yaml
key: java
displayName: Java
command: jdtls
args: []
fileExtensions: { .java: java }
detectExtensions: [.java]
detectFileNames: [pom.xml, build.gradle, build.gradle.kts]
vscodeExtensions: [redhat.java]
```

### cpp — C / C++

```yaml
key: cpp
displayName: C / C++
command: clangd
args: ["--background-index"]
fileExtensions:
  .c: c
  .h: c
  .cpp: cpp
  .cxx: cpp
  .cc: cpp
  .hpp: cpp
  .hxx: cpp
detectExtensions: [.c, .h, .cpp, .cxx, .cc, .hpp, .hxx]
vscodeExtensions: [ms-vscode.cpptools]
```

### csharp — C#

```yaml
key: csharp
displayName: C#
command: dotnet
args: ["dnx", "roslyn-language-server", "--yes", "--prerelease", "--", "--stdio", "--autoLoadProjects"]
fileExtensions: { .cs: csharp }
detectExtensions: [.cs, .csproj, .sln]
vscodeExtensions: [ms-dotnettools.csharp]
```

### ruby — Ruby

```yaml
key: ruby
displayName: Ruby
command: solargraph
args: ["stdio"]
fileExtensions:
  .rb: ruby
  .rbw: ruby
  .rake: ruby
  .gemspec: ruby
detectExtensions: [.rb, .rbw, .rake, .gemspec]
detectFileNames: [gemfile, rakefile]
vscodeExtensions: [castwide.solargraph]
```

### php — PHP

```yaml
key: php
displayName: PHP
command: intelephense
args: ["--stdio"]
fileExtensions: { .php: php }
detectExtensions: [.php]
detectFileNames: [composer.json]
vscodeExtensions: [bmewburn.vscode-intelephense-client]
```

### kotlin — Kotlin

```yaml
key: kotlin
displayName: Kotlin
command: kotlin-language-server
args: []
fileExtensions:
  .kt: kotlin
  .kts: kotlin
detectExtensions: [.kt, .kts]
vscodeExtensions: [fwcd.kotlin]
```

### swift — Swift

```yaml
key: swift
displayName: Swift
command: sourcekit-lsp
args: []
fileExtensions: { .swift: swift }
detectExtensions: [.swift]
detectFileNames: [package.swift]
vscodeExtensions: [swift-lang.swift]
```

### lua — Lua

```yaml
key: lua
displayName: Lua
command: lua-language-server
args: []
fileExtensions: { .lua: lua }
detectExtensions: [.lua]
vscodeExtensions: [sumneko.lua]
```

### yaml — YAML

```yaml
key: yaml
displayName: YAML
command: yaml-language-server
args: ["--stdio"]
fileExtensions:
  .yaml: yaml
  .yml: yaml
detectExtensions: [.yaml, .yml]
vscodeExtensions: [redhat.vscode-yaml]
```

### bash — Bash / Shell

```yaml
key: bash
displayName: Bash / Shell
command: bash-language-server
args: ["start"]
fileExtensions:
  .sh: shellscript
  .bash: shellscript
  .zsh: shellscript
detectExtensions: [.sh, .bash, .zsh]
vscodeExtensions: [mads-hartmann.bash-ide-vscode]
```

## Adding an entry — worked example (Elm)

```yaml
key: elm
displayName: Elm
command: elm-language-server
args: ["--stdio"]
fileExtensions:
  .elm: elm
detectExtensions: [.elm]
vscodeExtensions: [Elmtooling.elm-ls-vscode]
```

Checklist:
- [ ] `key` lowercase ASCII, never used before
- [ ] `command` is the binary name Copilot/VS Code will run (must be on
      the user's `PATH`)
- [ ] `fileExtensions` keys are lowercase with leading dot
- [ ] `fileExtensions` values are LSP `languageId` strings (consult the
      server's docs — for Elm it's `elm`, for some servers it's the
      same as the extension)
- [ ] `detectExtensions` covers the file extensions you want to trigger
      on (defaults to `Object.keys(fileExtensions)` if omitted)
- [ ] `detectFileNames` added if the language has a manifest (Cargo.toml,
      go.mod, package.swift, composer.json, etc.)
- [ ] `vscodeExtensions` Marketplace IDs verified — these get
      recommended to the user
- [ ] Re-ran the skill against a repo with that language; detection
      works, both files are written, verification passes
