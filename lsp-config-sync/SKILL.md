---
name: lsp-config
description: Detect languages in a repository, create or refresh `.github/lsp.json` for GitHub Copilot CLI, and merge VS Code extension recommendations into `.vscode/extensions.json`. Use when LSP configuration is missing or stale, a new language appears, or an installed language server needs repository wiring. Preserves unrelated servers, optional per-server settings, and other top-level fields. Does not install language servers.
---

# LSP Config

Detect the languages used in the current repository, update the project-level
GitHub Copilot CLI LSP configuration, merge VS Code extension recommendations,
and verify the resulting files.

**Announce at start:** "I'm using the lsp-config skill to detect languages and
refresh the Copilot/VS Code LSP wiring."

## Requirements

- Node.js 18 or later to run the bundled detector.
- Language server binaries must be installed separately and available on each
  user's `PATH`.
- Read [the catalog](references/catalog.md) when inspecting or changing the
  supported server definitions.

## When to use

- A new language was added and `.github/lsp.json` is missing or stale.
- A language server was installed and needs repository-level Copilot wiring.
- The workspace and its LSP configuration have drifted.
- The user asks which catalogued languages the repository contains.
- The user wants to add or revise a catalog entry.

## Avoid when

- The user wants language servers installed. This skill writes configuration
  only.
- The user wants MCP, hooks, plugins, or Copilot instruction changes.
- The current directory is not the repository workspace.
- The target is a Copilot plugin package. A plugin may use a root `lsp.json`,
  but ordinary repository configuration belongs at `.github/lsp.json`.

## Fast path

Run the detector from the installed skill directory and pass the workspace root
when it differs from the current directory:

```bash
node <skill-directory>/scripts/detect-languages.mjs [<workspace-root>]
```

For a project-local installation, this is commonly:

```bash
node .github/skills/lsp-config/scripts/detect-languages.mjs
```

Read the JSON output. If the user only asked what would be configured, report
the result and stop. Write files only when requested.

## Full path

1. **Detect.** Run the bundled detector. It returns `detected`,
   `detectedKeys`, `ignoredDirectories`, and `errors`. If `errors` is non-empty,
   report the affected paths and decide whether the remaining scan is sufficient
   before writing.
2. **Read the Copilot config.** Use `.github/lsp.json`. If it does not exist,
   start with `{ "lspServers": {} }`. If it exists but is not valid JSON, is not
   an object, or has a non-object `lspServers` value, stop without overwriting it
   and report the exact problem.
3. **Merge each detected server.** Preserve every unrelated top-level field and
   server key. For a detected key, preserve optional existing fields such as
   `env`, `rootUri`, `initializationOptions`, and timeout settings, while
   replacing the catalog-managed fields:

   ```js
   merged.lspServers[key] = {
     ...(isObject(existingEntry) ? existingEntry : {}),
     command: catalogEntry.command,
     args: [...catalogEntry.args],
     fileExtensions: { ...catalogEntry.fileExtensions },
   };
   ```

   The catalog is authoritative only for `command`, `args`, and
   `fileExtensions`. Never delete unknown servers or optional fields.
4. **Write `.github/lsp.json`.** Create `.github/` if needed. Use two-space JSON
   indentation and a trailing newline.
5. **Read the VS Code config.** Use `.vscode/extensions.json`. If absent, start
   with `{ "recommendations": [] }`. If present, require a JSON object and either
   an absent or array-valued `recommendations` field. Stop without overwriting a
   malformed file.
6. **Merge recommendations.** Add the unique `vscodeExtensions` values from all
   detected entries. Preserve existing recommendations and every other
   top-level field, including `unwantedRecommendations`.
7. **Write `.vscode/extensions.json`.** Create `.vscode/` if needed. Use
   two-space JSON indentation and a trailing newline.
8. **Verify from disk.** Re-read and parse both files, then run every check in
   the verification section. Do not report success when any check fails.
9. **Report.** List detected languages, files created or changed, preserved
   custom fields, scan errors, and verification results. Also report catalogued
   server commands that are not currently resolvable on `PATH`; do not install
   them.
10. **Reload when available.** In an interactive Copilot CLI session, use
    `/lsp reload`, then `/lsp test SERVER-NAME` for each changed server. Otherwise
    tell the user these runtime checks remain outstanding.

## Merge contract

The merge is **additive across keys and authoritative only for managed fields**.

- **Across keys:** preserve servers not detected during this run.
- **Within a detected key:** replace `command`, `args`, and `fileExtensions`
  with catalog values.
- **Optional fields:** preserve fields the catalog does not manage, including
  `env`, `rootUri`, `initializationOptions`, and timeouts.
- **Unknown keys:** never delete them.
- **VS Code recommendations:** union existing and catalog values; never remove
  existing recommendations.

This lets the skill repair stale core wiring without discarding valid
project-specific options.

## Adding a catalog entry

The human-readable source is [references/catalog.md](references/catalog.md);
the detector embeds the same entries in
`scripts/detect-languages.mjs`. Update both in the same change.

1. Add an entry with the required `key`, `displayName`, `command`, `args`, and
   `fileExtensions` fields.
2. Keep `key` stable, lowercase ASCII, and unique. Renaming a shipped key creates
   a different server identity.
3. Use documented LSP `languageId` values in `fileExtensions`, not guessed values.
4. Add `detectFileNames` for useful manifests. `detectExtensions` defaults to
   the keys of `fileExtensions`, so specify it only when detection should differ.
5. Verify each `vscodeExtensions` Marketplace ID before adding it.
6. Re-run the detector against a representative repository and an important
   edge case. Confirm that the catalog and embedded entry remain identical.

## Ignored directories

The detector does not descend into:

```text
.git  .idea  .next  .nuxt  .turbo  .venv  .vscode
bin  build  coverage  dist  node_modules  obj  out
target  tmp  venv
```

Add a directory only when it is generated output for most projects and scanning
it would create false positives. Do not broadly ignore `vendor/`,
`third_party/`, or `fixtures/`, because they may contain relevant source.

## Verification

Before reporting success, confirm:

| Check | Pass condition |
| --- | --- |
| Copilot config exists | `.github/lsp.json` exists and parses as a JSON object |
| Detected servers are present | each detected key has matching `command`, `args`, and `fileExtensions` |
| Optional server fields are preserved | pre-existing fields outside the managed three remain unchanged |
| Unknown servers are preserved | every pre-existing non-detected server key remains |
| Top-level Copilot fields are preserved | every pre-existing top-level key remains |
| VS Code recommendations are complete | every detected catalog extension is present |
| Other VS Code fields are preserved | pre-existing top-level fields remain unchanged |
| Files are stable | a second identical merge produces no diff |

A failure must identify the exact file, key, expected value, and actual value.
Do not silently overwrite malformed JSON and do not claim that configuration
proves the server binary starts successfully.

## Scope of audit

When the user asks what the skill sees, run the detector and report its output.
Do not reimplement detection heuristics in prose. Change detection by editing the
catalog and its embedded copy, not by adding one-off logic.
