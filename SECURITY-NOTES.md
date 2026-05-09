# Security Notes

## Accepted CVEs in dependencies

### CVE-2026-33671 — picomatch ReDoS

- **Severity:** HIGH (CVSS 7.5)
- **Source:** transitive dependency in node:24-alpine base image
- **Status:** ACCEPTED — not exploitable in this application
- **Reasoning:**
  - picomatch is a build-time glob matcher, not a runtime dependency
  - Application code does not pass user input to glob matching functions
  - No HTTP endpoint accepts patterns that would reach picomatch
- **Action when re-evaluating:** check if base image has been rebuilt with picomatch >= 4.0.4

## Why node:24-alpine and not node:24-alpine3.21

The floating tag `node:24-alpine` is regularly rebuilt with security patches.
Pinned minor versions like `node:24-alpine3.21` lag behind on patching for
OpenSSL, musl, and npm-bundled tools (tar, glob, minimatch).
Audit run on YYYY-MM-DD: floating tag had 1 high CVE, alpine3.21 had 26.
