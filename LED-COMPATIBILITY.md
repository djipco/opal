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

LEDs requiring both data and clock are not supported. Likewise, 12-bit or 16-bit components and special 
framing are not representable by the three current 8-bit formats.

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

## Future Output Profiles, Formats, or Mappings

| Product or family | What is needed |
|---|---|
| APA104 | Resolve materially conflicting published `T1H` and reset timings for an exact part and revision before assigning an output profile. |
| [CS8812](https://deskontroller.com/support/pixel-protocols/) | Obtain an exact RGB or RGBW product datasheet. Controller-level evidence describes WS281x-compatible timing, but does not define a revision-specific timing envelope or reset requirement. |
| GS8206 / GS8208B and other GS8208 revisions | Obtain revision-specific framing, current-control, timing, and reset evidence; do not infer compatibility from GS8208 V0.1. |
| [SM16703SP](https://www.ledyilighting.com/wp-content/uploads/2025/02/SM16703SP-datasheet.pdf) | Confirm its complete timing limits before assigning a mapping. |
| TM1804 / TM1809 / TM1812 | Obtain revision-specific manufacturer timing tables; these products are not assumed interchangeable. |
| [TM1814 / TM1829](https://deskontroller.com/support/pixel-protocols/) | Confirm each variant's RGB or RGBW mapping, additional current or brightness behavior, framing, timing, and intended default before defining a mapping. |
| [UCS1903 / UCS1904 / UCS2903 / UCS2904](https://deskontroller.com/support/pixel-protocols/) | Obtain revision-specific manufacturer timing tables and RGB/RGBW mappings; UCS1903 also needs separate treatment of its 400 and 800 kbit/s variants. |
| APA102 / APA102C / DotStar, APA107, HD107S, LPD6803/8806, P9813, SK9822/9826, WS2801/2803 | Data-and-clock interface. |
| HD108, SJ1221 (16-bit), SPXL-16bit, TLC5973 (16-bit), UCS7604 (16-bit), UCS8903/8904 (16-bit), 9PDOT (16-bit) | Component depth or framing is not one of the current 8-bit formats. |
| LD1510 12-bit and other 12-bit products | A future component-depth format is required. |
| [FW1906](https://deskontroller.com/support/pixel-protocols/) and products with extra function/control components | FW1906 uses a 48-bit, six-byte `R2 G2 B2 R1 G1 B1` IC frame for products described as having five active RGB+CCT or RGBWW channels. Those frame semantics do not map directly to RGB8, RGBW8, or RGBCCT8. |

## Opalinx 1.0 Output Profiles

| ID | Symbolic name | Interface | Bit cell | `T0H` | `T1H` | Reset low |
|---|---|---|---|---|---|---|
| `0x00` | `SINGLE_WIRE_PULSE_800K_T1` | DATA_ONLY | 1.10–1.40 µs | 250–450 ns | 550–850 ns | ≥80 µs |
| `0x01` | `SINGLE_WIRE_PULSE_400K_T1` | DATA_ONLY | 2.20–2.80 µs | 350–650 ns | 1.00–1.50 µs | ≥80 µs |
| `0x02` | `SINGLE_WIRE_PULSE_800K_T2` | DATA_ONLY | 1.10–1.40 µs | 250–450 ns | 700–900 ns | ≥300 µs |
| `0x03` | `SINGLE_WIRE_PULSE_500K_T1` | DATA_ONLY | 2.00–2.08 µs | 600–750 ns | 1.28–1.43 µs | ≥80 µs |
| `0x04` | `SINGLE_WIRE_PULSE_1M_T1` | DATA_ONLY | 1.00–1.04 µs | 300–390 ns | 640–730 ns | ≥80 µs |
| `0x05` | `SINGLE_WIRE_PULSE_800K_T3` | DATA_ONLY | 1.20–1.25 µs | 250–350 ns | 850–950 ns | ≥300 µs |

Normative definitions are in the [Opalinx protocol specification](README.md).
