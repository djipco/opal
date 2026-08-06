# Opalinx LED Compatibility Addendum

> [!NOTE]
> **Informative only.** This catalog is a selection aid, not a compatibility guarantee. Product
> revisions, clones, assembled strips, voltage levels, backup-data wiring, and firmware can differ.
> Perform your own tests.

## LED Configuration Selection

An **LED configuration** combines three independent properties:

1. **Pixel format**: `RGB8`, `RGBW8`, or `RGBCCT8` (also marketed as RGBWW or RGB+CCT). The `8` suffix
   means that each component has an unsigned 8-bit intensity (0-255).
3. **Component order**: the actual wire order, such as G R B, G R B W, or G R B cW wW.
4. **Output profile**: the data waveform and reset timing.

Opalinx 1.0 output profiles use the `DATA_ONLY` interface. A second backup-data input on an LED does not
make it clocked. Connect the first backup-data input according to the exact strip or module
documentation.

Mappings rely on the cited datasheets and apply to the identified product or revision; they must not
be generalized to undocumented revisions, clones, or assembled products sold under the same family
name. Products without an assigned Opalinx 1.0 output profile are listed separately in the future table.

## Opalinx 1.0 Mappings

| LED product or family | Interface | Pixel format | Component order | Output profile |
|---|---|---|---|---|
| WS2811, 800 kbit/s | Data only | RGB8 | Varies by assembly | `SINGLE_WIRE_PULSE_800K_T1` |
| WS2811, 400 kbit/s | Data only | RGB8 | Varies by assembly | `SINGLE_WIRE_PULSE_400K_T1` |
| WS2812 / WS2812B | Data only | RGB8 | Typically G R B; verify revision | `SINGLE_WIRE_PULSE_800K_T1` |
| WS2813 / WS2813B | Data + backup | RGB8 | G R B | `SINGLE_WIRE_PULSE_800K_T2` |
| WS2814 | Data + backup | RGBW8 | R G B W | `SINGLE_WIRE_PULSE_800K_T2` |
| [WS2815](https://www.ledyilighting.com/wp-content/uploads/2025/02/WS2815-datasheet.pdf) / WS2818 | Data + backup | RGB8 | Verify product documentation | `SINGLE_WIRE_PULSE_800K_T2` |
| SK6812 RGB | Data only | RGB8 | Typically G R B | `SINGLE_WIRE_PULSE_800K_T1` |
| SK6812 RGBW | Data only | RGBW8 | Typically G R B W | `SINGLE_WIRE_PULSE_800K_T1` |
| [SK6805-2427 Rev. 01](https://www.digikey.com/en/htmldatasheets/production/2352811/0/0/1/sk6805-2427) | Data only | RGB8 | G R B | `SINGLE_WIRE_PULSE_800K_T1` |
| [SK6813-05-EC20 Rev. 05](https://www.normandled.com/upload/202004/SK6813-05-EC20%20LED%20Datasheet.pdf) | Data + backup | RGB8 | G R B | `SINGLE_WIRE_PULSE_800K_T1` |
| [GS8208 V0.1](https://www.normandled.com/upload/201805/GS8208%20LED%20Datasheet.pdf) | Data + backup | RGB8 | G R B | `SINGLE_WIRE_PULSE_800K_T2` |
| [TM1803, low-speed mode](https://www.bestlightingbuy.com/pdf/TM1803%20Datasheet.pdf) | Data only | RGB8 | R G B | `SINGLE_WIRE_PULSE_500K_T1` |
| [TM1803, high-speed mode](https://www.bestlightingbuy.com/pdf/TM1803%20Datasheet.pdf) | Data only | RGB8 | R G B | `SINGLE_WIRE_PULSE_1M_T1` |
| [SM16703P](https://www.ledyilighting.com/wp-content/uploads/2025/02/SM16703P-datasheet.pdf) | Data only | RGB8 | R G B | `SINGLE_WIRE_PULSE_800K_T3` |
| [SM16704PB](https://gree-leds.com/web/userfiles/download/SM16704PBDatasheetEN.pdf) | Data only | RGBW8 | R G B W | `SINGLE_WIRE_PULSE_800K_T3` |
| [WS2805 V0.3](https://www.ledyilighting.com/wp-content/uploads/2025/02/WS2805-datasheet.pdf) | Data + backup | RGBCCT8 | R G B cW wW | `SINGLE_WIRE_PULSE_800K_T3` |

## Unsupported Interfaces and Formats

Opalinx 1.0 does not support data-and-clock interfaces such as APA102, APA102C, DotStar, APA107,
HD107S, LPD6803, LPD8806, P9813, SK9822, SK9826, WS2801, or WS2803.

It also does not support 12-bit or 16-bit formats such as HD108, SJ1221, SPXL-16bit, TLC5973,
UCS7604, UCS8903, UCS8904, 9PDOT, LD1510, or other products requiring component depths or framing
outside RGB8, RGBW8, and RGBCCT8. Other specialized formats, including FW1906, are likewise not
supported.

Additional output profiles for data-only 8-bit products may be added when suitable timing evidence
is available. Users may suggest profiles for consideration.

## Opalinx 1.0 Output Profiles

| ID | Symbolic name | Bit cell | `T0H` | `T1H` | Reset low |
|---|---|---|---|---|---|
| `0x00` | `SINGLE_WIRE_PULSE_800K_T1` | 1.10–1.40 µs | 250–450 ns | 550–850 ns | ≥80 µs |
| `0x01` | `SINGLE_WIRE_PULSE_400K_T1` | 2.20–2.80 µs | 350–650 ns | 1.00–1.50 µs | ≥80 µs |
| `0x02` | `SINGLE_WIRE_PULSE_800K_T2` | 1.10–1.40 µs | 250–450 ns | 700–900 ns | ≥300 µs |
| `0x03` | `SINGLE_WIRE_PULSE_500K_T1` | 2.00–2.08 µs | 600–750 ns | 1.28–1.43 µs | ≥80 µs |
| `0x04` | `SINGLE_WIRE_PULSE_1M_T1` | 1.00–1.04 µs | 300–390 ns | 640–730 ns | ≥80 µs |
| `0x05` | `SINGLE_WIRE_PULSE_800K_T3` | 1.20–1.25 µs | 250–350 ns | 850–950 ns | ≥300 µs |

Normative definitions are in the [Opalinx protocol specification](README.md).
