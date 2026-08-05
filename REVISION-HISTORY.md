# Opalinx Specification Revision History

This history records named specification revisions rather than individual commits, website releases,
firmware versions, or client-library versions. Git remains the detailed record of editorial changes
within a revision.

## 1.0.0-alpha.1 — 2026-08-04

Current prerelease specification.

- Defined `RGB8`, `RGBW8`, and `RGBCCT8` pixel formats with packed component ordering.
- Replaced product-named signaling modes with registered `DATA_ONLY` output profiles and explicit
  timing ranges.
- Added the informative LED compatibility addendum with datasheet-linked current and future mappings.
- Centralized protocol terminology, configuration registries, channel addressing, and the registry
  index.
- Consolidated the output pipeline state machine, transaction lifetime and timeout recovery, flow
  control, resource limits, and transport-binding requirements.
- Classified normative and informative references and separated repository metadata from numbered
  protocol sections.
- Published conformance corpus version 8 for the `1.0.0-alpha.1` wire contract.

## 1.0.0-alpha.0 — 2026-07-23

First Semantic Versioning prerelease.

- Established the host/device request-response model and 16-bit transaction identifiers.
- Defined COBS framing, CRC-16/CCITT-FALSE validation, identifier ranges, errors, and receiver
  recovery.
- Added configuration, pixel staging, Show, Reset, query, and namespaced vendor messages.
- Added extensible INFO records, capability reporting, version compatibility, and session-boundary
  behavior.
- Introduced the shared machine-readable conformance corpus.

## Pre-versioned draft — 2026-04 to 2026-07

- Developed the initial serial LED-control protocol under the OPAL name.
- Adopted COBS framing and the initial configuration and pixel-data message structures.
- Renamed the protocol to Opalinx before the first named prerelease.
