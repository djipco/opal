# Opalinx LED Compatibility Addendum

> [!NOTE]
> **Informative only.** This catalog is a selection aid, not a compatibility guarantee. Product
> revisions, clones, assembled strips, voltage levels, backup-data wiring, and firmware can differ.
> Perform your own tests.

## LED profile selection

An **LED profile** combines three independent properties:

1. **Pixel format**: `RGB8` (R G B), `RGBW8` (R G B W), or `RGBCCT8`, also marketed as RGBWW or
   RGB+CCT (R G B cW wW). The `8` suffix means that each component has an unsigned 8-bit intensity
   (0-255).
2. **Component order**: the actual wire order, such as G R B, G R B W, or G R B cW wW.
3. **Output profile**: the data waveform and reset timing.

Select the LED profile that matches all three properties of the product.

Opalinx 1.0 output profiles use the `DATA_ONLY` interface. A second backup-data input on an LED does not
make it clocked. Connect the first backup-data input according to the exact strip or module
documentation. LEDs requiring both data and clock need a future clocked output profile. Likewise, 12-bit
or 16-bit components and special framing are not representable by the three current 8-bit formats.

Mappings rely on the cited datasheets and apply to the identified product or revision; they must not
be generalized to undocumented revisions, clones, or assembled products sold under the same family
name. Products without an assigned Opalinx 1.0 output profile are listed separately in the future table.

## Opalinx 1.0 mappings

| LED product or family | Interface | Pixel format | Output profile | Notes |
|---|---|---|---|---|
| WS2811, 800 kbit/s | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Order varies by assembly. |
| WS2811, 400 kbit/s | Data only | RGB8 | `0x01` `SINGLE_WIRE_PULSE_400K_T1` | |
| WS2812 / WS2812B | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Commonly G R B; verify revision. |
| WS2813 / WS2813B | Data + backup | RGB8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | |
| WS2814 | Data + backup | RGBW8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | |
| [WS2815](https://www.ledyilighting.com/wp-content/uploads/2025/02/WS2815-datasheet.pdf) / WS2818 | Data + backup | RGB8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | |
| SK6812 RGB | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Commonly G R B. |
| SK6812 RGBW | Data only | RGBW8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | Commonly G R B W. |
| [SK6805-2427 Rev. 01](https://www.digikey.com/en/htmldatasheets/production/2352811/0/0/1/sk6805-2427) | Data only | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | |
| [SK6813-05-EC20 Rev. 05](https://www.normandled.com/upload/202004/SK6813-05-EC20%20LED%20Datasheet.pdf) | Data + backup | RGB8 | `0x00` `SINGLE_WIRE_PULSE_800K_T1` | |
| [GS8208 V0.1](https://www.normandled.com/upload/201805/GS8208%20LED%20Datasheet.pdf) | Data + backup | RGB8 | `0x02` `SINGLE_WIRE_PULSE_800K_T2` | |

## Future output profiles, formats, or mappings

| Product or family | What is needed |
|---|---|
| APA104 | Resolve materially conflicting published `T1H` and reset timings for an exact part and revision before assigning an output profile. |
| [CS8812](https://deskontroller.com/support/pixel-protocols/) | Obtain an exact RGB or RGBW product datasheet. Controller-level evidence describes WS281x-compatible timing, but does not define a revision-specific timing envelope or reset requirement. |
| GS8206 / GS8208B and other GS8208 revisions | Obtain revision-specific framing, current-control, timing, and reset evidence; do not infer compatibility from GS8208 V0.1. |
| [TM1803](https://www.bestlightingbuy.com/pdf/TM1803%20Datasheet.pdf) | Define an output profile whose complete timing envelope covers one of the documented 400 kbit/s or half-period high-speed modes. |
| [SM16703P](https://www.ledyilighting.com/wp-content/uploads/2025/02/SM16703P-datasheet.pdf) / [SM16703SP](https://www.ledyilighting.com/wp-content/uploads/2025/02/SM16703SP-datasheet.pdf) | Existing output profiles do not cover the complete documented timing requirements: SM16703P permits `T1H` through 1.00 µs, while SM16703SP does not specify a maximum `T1H`. Define an output profile for an exact part and revision before assigning a mapping. |
| [SM16704PB](https://gree-leds.com/web/userfiles/download/SM16704PBDatasheetEN.pdf) | The datasheet defines a data-only, 32-bit RGBW frame at 800 kbit/s. Validate its complete timing envelope and reset requirement against an output profile before assigning a mapping; RGBW format alone does not establish SM16703 timing compatibility. |
| TM1804 / TM1809 / TM1812 | Obtain revision-specific manufacturer timing tables; these products are not assumed interchangeable. |
| [TM1814 / TM1829](https://deskontroller.com/support/pixel-protocols/) | Confirm each variant's RGB or RGBW mapping, additional current or brightness behavior, framing, timing, and intended default before defining a mapping. |
| [UCS1903 / UCS1904 / UCS2903 / UCS2904](https://deskontroller.com/support/pixel-protocols/) | Obtain revision-specific manufacturer timing tables and RGB/RGBW mappings; UCS1903 also needs separate treatment of its 400 and 800 kbit/s variants. |
| [WS2805 V0.3](https://www.ledyilighting.com/wp-content/uploads/2025/02/WS2805-datasheet.pdf) | Defines a 40-bit `R G B W1 W2` frame, 0.22–0.38 µs `T0H`, 0.58–1.00 µs `T1H`, and at least 280 µs reset. Output profile `0x02` meets the reset requirement but permits `T0H` beyond the documented maximum. Obtain a production-revision datasheet and confirm that W1/W2 represent `cW`/`wW` before assigning a mapping. |
| APA102 / APA102C / DotStar, APA107, HD107S, LPD6803/8806, P9813, SK9822/9826, WS2801/2803 | Data-and-clock interface. |
| HD108, SJ1221 (16-bit), SPXL-16bit, TLC5973 (16-bit), UCS7604 (16-bit), UCS8903/8904 (16-bit), 9PDOT (16-bit) | Component depth or framing is not one of the current 8-bit formats. |
| LD1510 12-bit and other 12-bit products | A future component-depth format is required. |
| [FW1906](https://deskontroller.com/support/pixel-protocols/) and products with extra function/control components | FW1906 uses a 48-bit, six-byte `R2 G2 B2 R1 G1 B1` IC frame for products described as having five active RGB+CCT or RGBWW channels. Those frame semantics do not map directly to RGB8, RGBW8, or RGBCCT8. |

## Opalinx 1.0 output profiles

| ID | Symbolic name | Interface | Bit cell | `T0H` | `T1H` | Reset low |
|---|---|---|---|---|---|---|
| `0x00` | `SINGLE_WIRE_PULSE_800K_T1` | DATA_ONLY | 1.10–1.40 µs | 250–450 ns | 550–850 ns | ≥80 µs |
| `0x01` | `SINGLE_WIRE_PULSE_400K_T1` | DATA_ONLY | 2.20–2.80 µs | 350–650 ns | 1.00–1.50 µs | ≥80 µs |
| `0x02` | `SINGLE_WIRE_PULSE_800K_T2` | DATA_ONLY | 1.10–1.40 µs | 250–450 ns | 700–900 ns | ≥300 µs |

Normative definitions are in the [Opalinx protocol specification](README.md).
