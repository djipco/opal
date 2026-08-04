# Opalinx LED Compatibility Addendum

> **Informative only.** This catalog is a selection aid, not a compatibility guarantee. Product
> revisions, clones, assembled strips, voltage levels, backup-data wiring, and firmware can differ.

## How to select a configuration

Match three independent properties:

1. **Pixel format** — `RGB8` (red, green, blue), `RGBW8` (red, green, blue, white), or `RGBCCT8`
   (red, green, blue, cool white, warm white; also marketed as RGBWW or RGB+CCT). The `8` suffix
   means that each component has an unsigned 8-bit intensity.
2. **Component order** — the actual wire order, such as GRB, GRBW, or GRB-CW-WW.
3. **Output profile** — the data waveform and reset timing.

Opalinx 1.0 profiles use the `DATA_ONLY` interface. A second backup-data input on an LED does not
make it clocked and may still be usable according to the controller's wiring. LEDs requiring both
data and clock need a future clocked profile. Likewise, 12-bit or 16-bit components and special
framing are not representable by the three current 8-bit formats.

Statuses below mean **mapped** (a current profile is identified), **datasheet candidate** (a named
datasheet revision has timing that overlaps a current profile, but the mapping has not been verified
on hardware), **candidate** (the format and interface are representable but revision-specific timing
evidence is still missing or conflicting), or **future profile** (clocking, component depth, framing,
or channel semantics are not covered today). A datasheet candidate is not a guarantee that every
conforming implementation of the suggested profile will drive every product revision: the device's
actual output timings must also fall inside the LED's accepted ranges.

## Current and candidate mappings

| LED product or family | Interface | Pixel format | Suggested profile | Status | Notes |
|---|---|---|---|---|---|
| WS2811, 800 kbit/s | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Mapped | Order varies by assembly. |
| WS2811, 400 kbit/s | Data only | RGB8 | `0x01` `SINGLE_WIRE_PULSE_400K_T1` | Mapped | Select only for parts supporting the slower mode. |
| WS2812 / WS2812B | Data only | RGB8 | `0x00` | Candidate | Commonly GRB; verify revision. |
| WS2813 / WS2813B | Data + backup | RGB8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | Mapped | Backup-data topology is outside the profile. |
| WS2814 | Data + backup | RGBW8 | `0x02` | Candidate | Verify format, order, and exact revision. |
| WS2815 / WS2818 | Data + backup | RGB8 | `0x02` | Candidate | Controller must provide suitable backup wiring if used. |
| SK6812 RGB | Data only | RGB8 | `0x00` | Candidate | Commonly GRB. |
| SK6812 RGBW | Data only | RGBW8 | `0x00` | Candidate | Commonly GRBW. |
| APA104 | Data only | RGB8 | Not yet assigned | Candidate | Published sheets conflict materially on `T1H` and reset timing; identify the exact part and revision. |
| SK6805-2427 Rev. 01 | Data only | RGB8 | `0x00` | Datasheet candidate | 1.25 µs nominal cell, 0.30 µs `T0H`, 0.60 µs `T1H`, and ≥80 µs reset. Other SK6805 packages/revisions need separate checks. |
| SK6813-05-EC20 Rev. 05 | Data + backup | RGB8 | `0x00` | Datasheet candidate | ≥1.20 µs cell, 0.20–0.40 µs `T0H`, 0.62–1.00 µs `T1H`, and >80 µs reset. |
| GS8208 V0.1 | Data + backup | RGB8 | `0x02` | Datasheet candidate | The sheet defines a 1.25 µs nominal cell, 1:3/3:1 duty encoding, and >300 µs reset. Backup-data topology is outside Opalinx 1.0. |
| GS8206 / GS8208B and other revisions | Data + backup | RGB8 | Not yet assigned | Candidate | Do not infer compatibility from GS8208 V0.1; framing, current-control features, and reset behavior require revision-specific confirmation. |
| SM16703 / SM16704 | Data only | RGB8 / RGBW8 | `0x02` | Datasheet candidate | SM16703 timing evidence gives 0.30 µs `T0H`, 0.90 µs `T1H`, and >80 µs reset; SM16704 is documented as its RGBW counterpart. Confirm the exact revision. |
| TM1803 | Data only | RGB8 | Not yet assigned | Candidate | The reviewed sheet defines distinct 400 kbit/s and half-period high-speed modes, but neither is fully contained by a current profile's timing envelope. |
| TM1804 / TM1809 / TM1812 | Data only | RGB8 | Not yet assigned | Candidate | Commercial controllers distinguish these names; a revision-specific manufacturer timing table is still required. |
| TM1814 | Data only | RGBW8 | Not yet assigned | Candidate | Published documentation includes additional current/brightness control behavior; confirm framing and the intended default before mapping ordinary RGBW data. |
| UCS1903 / UCS2903 / UCS2904 | Data only | RGB8 / RGBW8 | Not yet assigned | Candidate | Interface, depth, and rate are documented, but a revision-specific manufacturer timing table is still required; UCS1903 also has 400 and 800 kbit/s variants. |
| WS2805 V0.3 | Data + backup | RGBCCT8 | `0x02` | Datasheet candidate | 40-bit RGBW1W2 frames, approximately 1.25 µs cells, 0.22–0.38 µs `T0H`, 0.58–1.00 µs `T1H`, and ≥280 µs reset; profile `0x02` supplies ≥300 µs reset. |

## Products requiring future profiles or formats

| Product or family | Why current Opalinx 1.0 profiles do not describe it |
|---|---|
| APA102 / APA102C / DotStar, APA107, HD107S, LPD6803/8806, P9813, SK9822/9826, WS2801/2803 | Data-and-clock interface. |
| HD108, SJ1221 (16-bit), SPXL-16bit, TLC5973 (16-bit), UCS7604 (16-bit), UCS8903/8904 (16-bit), 9PDOT (16-bit) | Component depth or framing is not one of the current 8-bit formats. |
| LD1510 12-bit and other 12-bit products | A future component-depth format is required. |
| FW1906 and products with extra function/control components | Their frame semantics do not map directly to RGB8, RGBW8, or RGBCCT8. |

## Commercial controller catalog comparison

This matrix helps identify alternate names and the breadth users may encounter. **Listed** means the
name appears in the cited manufacturer's current documentation; **family** means a closely related
base name appears, not that the suffix has been verified. A dash means it was not found, not that
the controller definitely cannot drive it. Firmware revisions may change these lists.

| Product named by ENTTEC OCTO Mk3 | OCTO Mk3 | DESKONTROLLER LITE V3 | Advatek PixLite Mk3 | Opalinx 1.0 classification |
|---|---:|---:|---:|---|
| APA102 | Listed | Listed | Listed | Future clocked profile |
| APA104 | Listed | Listed | Listed | Data-only candidate |
| GS8208B | Listed | Family (GS8208) | Family (GS8208) | Data-only/backup candidate |
| SJ1221 (16-bit) | Listed | — | — | Future 16-bit format/profile |
| SK6805 | Listed | Listed | Listed | Data-only candidate |
| SK6812 | Listed | Listed | Listed | RGB8/RGBW8 candidate |
| SK6813 | Listed | Listed | Listed | Data-only candidate |
| SM16703 | Listed | Listed | Listed | Data-only candidate |
| SM16704 | Listed | Listed | Listed | Data-only candidate |
| SPXL-16bit | Listed | — | Listed (ENTTEC SPXL) | Future 16-bit format/profile |
| TLC5973 (16-bit) | Listed | — | — | Future 16-bit format/profile |
| TM1804 | Listed | Listed | Listed | Data-only candidate |
| TM1812 | Listed | Listed | — | Data-only candidate |
| TM1814 | Listed | Listed | Listed | RGBW8 candidate |
| UCS1903 | Listed | Listed | Listed | Data-only candidate |
| UCS2903 | Listed | Listed | Listed | Data-only candidate |
| UCS2904 | Listed | Listed | Listed | Data-only candidate |
| UCS7604 (16-bit) | Listed | — | Listed | Future 16-bit format/profile |
| UCS8903 (16-bit) | Listed | Listed | Listed | Future 16-bit format/profile |
| UCS8904 (16-bit) | Listed | Listed | Listed | Future 16-bit format/profile |
| WS2811 | Listed | Listed | Listed | `0x00` or `0x01` |
| WS2812 / WS2812B | Listed | Listed | Listed | `RGB8` + `0x00` candidate |
| WS2813 | Listed | Listed | Listed | `RGB8` + `0x02` |
| WS2814 | Listed | Listed | Listed | `RGBW8` + `0x02` candidate |
| WS2815 | Listed | Listed | Listed | `RGB8` + `0x02` candidate |
| WS2818 | Listed | Listed | Listed | `RGB8` + `0x02` candidate |
| 9PDOT (16-bit) | Listed | — | — | Future 16-bit format/profile |

DESKONTROLLER and Advatek document many additional products. Their catalogs include clocked,
custom-timing, 12/16-bit, RGBW, RGB+CCT, backup-data, and special-frame devices; the classification
above explains which Opalinx dimension must expand rather than treating each chip name as a protocol.

## Current profile summary

| ID | Symbolic name | Interface | Bit cell | `T0H` | `T1H` | Reset low |
|---|---|---|---|---|---|---|
| `0x00` | `SINGLE_WIRE_PULSE_800K_T1` | DATA_ONLY | 1.10–1.40 µs | 250–450 ns | 550–850 ns | ≥80 µs |
| `0x01` | `SINGLE_WIRE_PULSE_400K_T1` | DATA_ONLY | 2.20–2.80 µs | 350–650 ns | 1.00–1.50 µs | ≥80 µs |
| `0x02` | `SINGLE_WIRE_PULSE_800K_T2` | DATA_ONLY | 1.10–1.40 µs | 250–450 ns | 700–900 ns | ≥300 µs |

Normative definitions are in the [Opalinx protocol specification](README.md).

## Sources and evidence

- [ENTTEC OCTO Mk3 product page](https://www.enttec.com/product/led-pixel-control/octo-mk3-32u-led-pixel-controller/)
- [DESKONTROLLER LITE V3 user manual](https://deskontroller.com/download/deskontroller-lite-V3-user-manual.pdf)
- [DESKONTROLLER pixel protocols](https://deskontroller.com/support/pixel-protocols/)
- [Advatek pixel protocol glossary](https://www.advateklighting.com/en-us/pixel-protocols)
- [Advatek PixLite comparison](https://www.advateklighting.com/pixlite-product-comparison)
- [SK6805-2427 Rev. 01 datasheet](https://www.digikey.com/en/htmldatasheets/production/2352811/0/0/1/sk6805-2427)
- [SK6813-05-EC20 Rev. 05 datasheet](https://www.normandled.com/upload/202004/SK6813-05-EC20%20LED%20Datasheet.pdf)
- [GS8208 V0.1 datasheet](https://www.normandled.com/upload/201805/GS8208%20LED%20Datasheet.pdf)
- [TM1803 datasheet](https://www.bestlightingbuy.com/pdf/TM1803%20Datasheet.pdf)
- [WS2805 V0.3 datasheet](https://www.ledyilighting.com/wp-content/uploads/2025/02/WS2805-datasheet.pdf)

Before upgrading a candidate to a tested claim, record the exact part and datasheet revision,
controller hardware and firmware, measured bit and reset timings, voltage, pixel count, cable length,
test pattern, and observed result. List clones and assembled strips separately when possible.
