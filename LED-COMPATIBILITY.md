# Opalinx LED Compatibility Addendum

> **Informative only.** This document is not part of the normative Opalinx specification. A product
> appearing here does not guarantee compatibility with every revision, clone, strip assembly,
> controller, cable length, voltage level, or installation. Verify the exact LED datasheet and test
> the complete system before deployment.

## How to use this table

Opalinx output profiles identify controller waveform behavior, not LED products. This table maps
specific product families to the most likely Opalinx profile and commonly encountered color order.
The mapping is a starting point for configuration and testing.

Compatibility status has these meanings:

- **Implemented mapping** — existing Opalinx controller firmware historically exposed this product
  family under the corresponding numeric profile. This is not a claim that every product revision
  has been electrically tested.
- **Timing-compatible candidate** — published timing requirements appear compatible with the
  profile's nominal waveform, but the mapping has not yet been validated across representative
  hardware.
- **Unverified** — insufficient revision-specific evidence or testing is available.

## Compatibility table

| LED product or family | Suggested Opalinx output profile | Common color order | Status | Notes |
|-----------------------|-----------------------------------|--------------------|--------|-------|
| WS2811, 800 kbit/s mode | `0x00` — `SINGLE_WIRE_PULSE_800K_T1` | Varies by assembly | Implemented mapping | External driver IC; verify strip wiring and exact revision. |
| WS2811, 400 kbit/s mode | `0x01` — `SINGLE_WIRE_PULSE_400K_T1` | Varies by assembly | Implemented mapping | Intended for WS2811 products that require or permit the slower mode. |
| WS2812 / WS2812B | `0x00` — `SINGLE_WIRE_PULSE_800K_T1` | Commonly GRB | Timing-compatible candidate | Product revisions and third-party parts sold under these names vary. |
| WS2813 / WS2813B | `0x02` — `SINGLE_WIRE_PULSE_800K_T2` | Commonly GRB | Implemented mapping | Uses the longer-high and longer-reset 800 kbit/s profile. Verify backup-data wiring separately. |
| WS2814 | `0x02` — `SINGLE_WIRE_PULSE_800K_T2` | Varies; often RGBW | Unverified | Confirm the exact part number, component count, color order, and reset requirement. |
| WS2815 | `0x02` — `SINGLE_WIRE_PULSE_800K_T2` | Commonly GRB | Timing-compatible candidate | Signal waveform and dual-signal wiring are separate concerns. |
| SK6812 RGB | `0x00` — `SINGLE_WIRE_PULSE_800K_T1` | Commonly GRB | Timing-compatible candidate | Confirm package and revision; SK6812 is used for several product variants. |
| SK6812 RGBW | `0x00` — `SINGLE_WIRE_PULSE_800K_T1` | Commonly GRBW | Timing-compatible candidate | Configure a four-component color order and verify the white-component position. |

## Profile summary

| ID | Symbolic name | Nominal bit rate | Nominal `T0H` | Nominal `T1H` | Minimum reset low |
|----|---------------|------------------|----------------|----------------|-------------------|
| `0x00` | `SINGLE_WIRE_PULSE_800K_T1` | 800 kbit/s | 312.5 ns | 625 ns | 80 µs |
| `0x01` | `SINGLE_WIRE_PULSE_400K_T1` | 400 kbit/s | 500 ns | 1.25 µs | 80 µs |
| `0x02` | `SINGLE_WIRE_PULSE_800K_T2` | 800 kbit/s | 312.5 ns | 781.25 ns | 300 µs |

The normative definitions and numeric assignments are in the
[Opalinx protocol specification](README.md). This addendum may be corrected or expanded without
changing the Opalinx wire protocol.

## Evidence still needed

Before changing a mapping to a tested compatibility claim, record:

- exact manufacturer and complete part number;
- datasheet revision and publication date;
- controller hardware and firmware version;
- measured `T0H`, `T1H`, bit-cell, and reset timings;
- tested supply and logic voltage;
- pixel count, cable length, and test pattern;
- observed result and environmental conditions.

Clones and assembled strips should be listed separately when their actual controller IC or timing
requirements are known.
