# Opalinx LED Compatibility Addendum

> [!NOTE]
> **Informative only.** This catalog is a selection aid, not a compatibility guarantee. Product
> revisions, clones, assembled strips, voltage levels, backup-data wiring, and firmware can differ.

## How to select a configuration

Match three independent properties:

1. **Pixel format** — `RGB8` (R G B), `RGBW8` (R G B W), or `RGBCCT8` (R G B cW wW; also marketed
   as RGBWW or RGB+CCT). The `8` suffix
   means that each component has an unsigned 8-bit intensity.
2. **Component order** — the actual wire order, such as G R B, G R B W, or G R B cW wW.
3. **Output profile** — the data waveform and reset timing.

Opalinx 1.0 profiles use the `DATA_ONLY` interface. A second backup-data input on an LED does not
make it clocked and may still be usable according to the controller's wiring. LEDs requiring both
data and clock need a future clocked profile. Likewise, 12-bit or 16-bit components and special
framing are not representable by the three current 8-bit formats.

Mappings rely on the cited datasheets and apply to the identified product or revision; they must not
be generalized to undocumented revisions, clones, or assembled products sold under the same family
name. Products without an assigned Opalinx 1.0 profile are listed separately in the future table.

## Current mappings

| LED product or family | Interface | Pixel format | Profile | Notes |
|---|---|---|---|---|
| WS2811, 800 kbit/s | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Order varies by assembly. |
| WS2811, 400 kbit/s | Data only | RGB8 | `0x01` `SINGLE_WIRE_PULSE_400K_T1` | Select only for parts supporting the slower mode. |
| WS2812 / WS2812B | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Commonly G R B; verify revision. |
| WS2813 / WS2813B | Data + backup | RGB8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | Backup-data topology is outside the profile. |
| WS2814 | Data + backup | RGBW8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | Verify format, order, and exact revision. |
| WS2815 / WS2818 | Data + backup | RGB8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | Controller must provide suitable backup wiring if used. |
| SK6812 RGB | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Commonly G R B. |
| SK6812 RGBW | Data only | RGBW8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Commonly G R B W. |
| [SK6805-2427 Rev. 01](https://www.digikey.com/en/htmldatasheets/production/2352811/0/0/1/sk6805-2427) | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | 1.25 µs nominal cell, 0.30 µs `T0H`, 0.60 µs `T1H`, and ≥80 µs reset. Other SK6805 packages/revisions need separate checks. |
| [SK6813-05-EC20 Rev. 05](https://www.normandled.com/upload/202004/SK6813-05-EC20%20LED%20Datasheet.pdf) | Data + backup | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | ≥1.20 µs cell, 0.20–0.40 µs `T0H`, 0.62–1.00 µs `T1H`, and >80 µs reset. |
| [GS8208 V0.1](https://www.normandled.com/upload/201805/GS8208%20LED%20Datasheet.pdf) | Data + backup | RGB8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | The sheet defines a 1.25 µs nominal cell, 1:3/3:1 duty encoding, and >300 µs reset. Backup-data topology is outside Opalinx 1.0. |
| SM16703 / SM16704 | Data only | RGB8 / RGBW8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | SM16703 timing evidence gives 0.30 µs `T0H`, 0.90 µs `T1H`, and >80 µs reset; SM16704 is documented as its RGBW counterpart. Confirm the exact revision. |
| [WS2805 V0.3](https://www.ledyilighting.com/wp-content/uploads/2025/02/WS2805-datasheet.pdf) | Data + backup | RGBCCT8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | 40-bit RGBW1W2 frames, approximately 1.25 µs cells, 0.22–0.38 µs `T0H`, 0.58–1.00 µs `T1H`, and ≥280 µs reset; profile `0x02` (`SINGLE_WIRE_PULSE_800K_T2`) supplies ≥300 µs reset. |

## Future profiles, formats, or mappings

| Product or family | What is needed |
|---|---|
| APA104 | Resolve materially conflicting published `T1H` and reset timings for an exact part and revision before assigning a profile. |
| GS8206 / GS8208B and other GS8208 revisions | Obtain revision-specific framing, current-control, timing, and reset evidence; do not infer compatibility from GS8208 V0.1. |
| [TM1803](https://www.bestlightingbuy.com/pdf/TM1803%20Datasheet.pdf) | Define a profile whose complete timing envelope covers one of the documented 400 kbit/s or half-period high-speed modes. |
| TM1804 / TM1809 / TM1812 | Obtain revision-specific manufacturer timing tables; these products are not assumed interchangeable. |
| TM1814 | Confirm its additional current or brightness behavior, framing, and intended default before defining a mapping. |
| UCS1903 / UCS2903 / UCS2904 | Obtain revision-specific manufacturer timing tables; UCS1903 also needs separate treatment of its 400 and 800 kbit/s variants. |
| APA102 / APA102C / DotStar, APA107, HD107S, LPD6803/8806, P9813, SK9822/9826, WS2801/2803 | Data-and-clock interface. |
| HD108, SJ1221 (16-bit), SPXL-16bit, TLC5973 (16-bit), UCS7604 (16-bit), UCS8903/8904 (16-bit), 9PDOT (16-bit) | Component depth or framing is not one of the current 8-bit formats. |
| LD1510 12-bit and other 12-bit products | A future component-depth format is required. |
| FW1906 and products with extra function/control components | Their frame semantics do not map directly to RGB8, RGBW8, or RGBCCT8. |

## Current profile summary

| ID | Symbolic name | Interface | Bit cell | `T0H` | `T1H` | Reset low |
|---|---|---|---|---|---|---|
| `0x00` | `SINGLE_WIRE_PULSE_800K_T1` | DATA_ONLY | 1.10–1.40 µs | 250–450 ns | 550–850 ns | ≥80 µs |
| `0x01` | `SINGLE_WIRE_PULSE_400K_T1` | DATA_ONLY | 2.20–2.80 µs | 350–650 ns | 1.00–1.50 µs | ≥80 µs |
| `0x02` | `SINGLE_WIRE_PULSE_800K_T2` | DATA_ONLY | 1.10–1.40 µs | 250–450 ns | 700–900 ns | ≥300 µs |

Normative definitions are in the [Opalinx protocol specification](README.md).
