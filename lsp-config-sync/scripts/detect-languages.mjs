#!/usr/bin/env node
// Detects which languages in the LSP catalog are present in a workspace.
// Self-contained — the catalog is embedded inline so this script has no
// runtime dependency on the skill's reference files. Keep the entries
// here in sync with `references/catalog.md`. Output is JSON on stdout so
// the agent (or any other tool) can consume it deterministically.
//
// Usage:
//   node detect-languages.mjs [<workspace-root>]
//
// Defaults to process.cwd(). Normal scans exit 0, including partial scans
// with recoverable errors. Unexpected fatal failures exit 1.
//
// Output shape:
//   {
//     workspaceRoot: "/abs/path",
//     detected: [
//       {
//         key: "typescript",
//         displayName: "TypeScript / JavaScript",
//         command: "typescript-language-server",
//         args: ["--stdio"],
//         fileExtensions: { ".ts": "typescript", ... },
//         detectExtensions: [".ts", ...],
//         detectFileNames: undefined,
//         vscodeExtensions: []
//       },
//       ...
//     ],
//     detectedKeys: ["typescript", "bash"],
//     ignoredDirectories: [".git", "node_modules", ...],
//     errors: []
//   }

import { readdir } from "node:fs/promises";
import { extname, isAbsolute, join, resolve } from "node:path";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".idea",
  ".next",
  ".nuxt",
  ".turbo",
  ".venv",
  ".vscode",
  "bin",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "obj",
  "out",
  "target",
  "tmp",
  "venv",
]);

const CATALOG = [
  {
    key: "typescript",
    displayName: "TypeScript / JavaScript",
    command: "typescript-language-server",
    args: ["--stdio"],
    fileExtensions: {
      ".ts": "typescript",
      ".tsx": "typescriptreact",
      ".js": "javascript",
      ".jsx": "javascriptreact",
      ".mjs": "javascript",
      ".cjs": "javascript",
      ".mts": "typescript",
      ".cts": "typescript",
    },
    detectExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"],
    vscodeExtensions: [],
  },
  {
    key: "python",
    displayName: "Python",
    command: "pyright-langserver",
    args: ["--stdio"],
    fileExtensions: { ".py": "python", ".pyw": "python", ".pyi": "python" },
    detectExtensions: [".py", ".pyw", ".pyi"],
    vscodeExtensions: ["ms-python.python", "ms-python.vscode-pylance"],
  },
  {
    key: "go",
    displayName: "Go",
    command: "gopls",
    args: ["serve"],
    fileExtensions: { ".go": "go" },
    detectExtensions: [".go"],
    detectFileNames: ["go.mod", "go.work"],
    vscodeExtensions: ["golang.go"],
  },
  {
    key: "rust",
    displayName: "Rust",
    command: "rust-analyzer",
    args: [],
    fileExtensions: { ".rs": "rust" },
    detectExtensions: [".rs"],
    detectFileNames: ["cargo.toml"],
    vscodeExtensions: ["rust-lang.rust-analyzer"],
  },
  {
    key: "java",
    displayName: "Java",
    command: "jdtls",
    args: [],
    fileExtensions: { ".java": "java" },
    detectExtensions: [".java"],
    detectFileNames: ["pom.xml", "build.gradle", "build.gradle.kts"],
    vscodeExtensions: ["redhat.java"],
  },
  {
    key: "cpp",
    displayName: "C / C++",
    command: "clangd",
    args: ["--background-index"],
    fileExtensions: {
      ".c": "c",
      ".h": "c",
      ".cpp": "cpp",
      ".cxx": "cpp",
      ".cc": "cpp",
      ".hpp": "cpp",
      ".hxx": "cpp",
    },
    detectExtensions: [".c", ".h", ".cpp", ".cxx", ".cc", ".hpp", ".hxx"],
    vscodeExtensions: ["ms-vscode.cpptools"],
  },
  {
    key: "csharp",
    displayName: "C#",
    command: "dotnet",
    args: [
      "dnx",
      "roslyn-language-server",
      "--yes",
      "--prerelease",
      "--",
      "--stdio",
      "--autoLoadProjects",
    ],
    fileExtensions: { ".cs": "csharp" },
    detectExtensions: [".cs", ".csproj", ".sln"],
    vscodeExtensions: ["ms-dotnettools.csharp"],
  },
  {
    key: "ruby",
    displayName: "Ruby",
    command: "solargraph",
    args: ["stdio"],
    fileExtensions: { ".rb": "ruby", ".rbw": "ruby", ".rake": "ruby", ".gemspec": "ruby" },
    detectExtensions: [".rb", ".rbw", ".rake", ".gemspec"],
    detectFileNames: ["gemfile", "rakefile"],
    vscodeExtensions: ["castwide.solargraph"],
  },
  {
    key: "php",
    displayName: "PHP",
    command: "intelephense",
    args: ["--stdio"],
    fileExtensions: { ".php": "php" },
    detectExtensions: [".php"],
    detectFileNames: ["composer.json"],
    vscodeExtensions: ["bmewburn.vscode-intelephense-client"],
  },
  {
    key: "kotlin",
    displayName: "Kotlin",
    command: "kotlin-language-server",
    args: [],
    fileExtensions: { ".kt": "kotlin", ".kts": "kotlin" },
    detectExtensions: [".kt", ".kts"],
    vscodeExtensions: ["fwcd.kotlin"],
  },
  {
    key: "swift",
    displayName: "Swift",
    command: "sourcekit-lsp",
    args: [],
    fileExtensions: { ".swift": "swift" },
    detectExtensions: [".swift"],
    detectFileNames: ["package.swift"],
    vscodeExtensions: ["swift-lang.swift"],
  },
  {
    key: "lua",
    displayName: "Lua",
    command: "lua-language-server",
    args: [],
    fileExtensions: { ".lua": "lua" },
    detectExtensions: [".lua"],
    vscodeExtensions: ["sumneko.lua"],
  },
  {
    key: "yaml",
    displayName: "YAML",
    command: "yaml-language-server",
    args: ["--stdio"],
    fileExtensions: { ".yaml": "yaml", ".yml": "yaml" },
    detectExtensions: [".yaml", ".yml"],
    vscodeExtensions: ["redhat.vscode-yaml"],
  },
  {
    key: "bash",
    displayName: "Bash / Shell",
    command: "bash-language-server",
    args: ["start"],
    fileExtensions: { ".sh": "shellscript", ".bash": "shellscript", ".zsh": "shellscript" },
    detectExtensions: [".sh", ".bash", ".zsh"],
    vscodeExtensions: ["mads-hartmann.bash-ide-vscode"],
  },
].map((entry) => ({
  ...entry,
  detectExtensions: entry.detectExtensions ?? Object.keys(entry.fileExtensions),
}));

function buildIndex(catalog) {
  const byExtension = new Map();
  const byFileName = new Map();
  for (const entry of catalog) {
    for (const ext of entry.detectExtensions ?? []) {
      const list = byExtension.get(ext) ?? [];
      list.push(entry.key);
      byExtension.set(ext, list);
    }
    for (const name of entry.detectFileNames ?? []) {
      const list = byFileName.get(name) ?? [];
      list.push(entry.key);
      byFileName.set(name, list);
    }
  }
  return { byExtension, byFileName };
}

const INDEX = buildIndex(CATALOG);

function detectFile(fileName, detectedKeys) {
  const normalizedName = fileName.toLowerCase();
  const normalizedExt = extname(normalizedName);

  for (const key of INDEX.byFileName.get(normalizedName) ?? []) {
    detectedKeys.add(key);
  }
  for (const key of INDEX.byExtension.get(normalizedExt) ?? []) {
    detectedKeys.add(key);
  }
}

async function walk(directory, detectedKeys, errors, depth = 0) {
  if (detectedKeys.size === CATALOG.length) return;
  if (depth > 50) {
    errors.push({ path: directory, message: "Max depth (50) reached; skipping subtree." });
    return;
  }

  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    errors.push({ path: directory, message: error.message });
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      await walk(join(directory, entry.name), detectedKeys, errors, depth + 1);
      if (detectedKeys.size === CATALOG.length) return;
      continue;
    }
    if (!entry.isFile()) continue;
    detectFile(entry.name, detectedKeys);
    if (detectedKeys.size === CATALOG.length) return;
  }
}

function resolveWorkspaceRoot(input) {
  if (input === undefined) return resolve(process.cwd());
  return isAbsolute(input) ? resolve(input) : resolve(process.cwd(), input);
}

async function main() {
  const arg = process.argv[2];
  const workspaceRoot = resolveWorkspaceRoot(arg);
  const detectedKeys = new Set();
  const errors = [];

  await walk(workspaceRoot, detectedKeys, errors);

  const detected = CATALOG.filter((entry) => detectedKeys.has(entry.key));

  const result = {
    workspaceRoot,
    detected,
    detectedKeys: [...detectedKeys].sort(),
    ignoredDirectories: [...IGNORED_DIRECTORIES].sort(),
    errors,
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({ fatal: message, detected: [], errors: [] }) + "\n");
  process.exitCode = 1;
});
