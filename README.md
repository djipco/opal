# Open Protocol for Addressable Lighting
 
OPAL is a lightweight binary protocol for controlling multi-channel addressable LEDs controllers
over a reliable byte stream (typically serial over USB).

OPAL targets one-wire addressable LED chips in the WS281x family, including WS2811, WS2812, WS2812B, 
WS2813, and their variants (e.g., WS2814, WS2815, SK6812). Both 3-component (RGB) and 4-component 
(RGBW) chips are supported via configurable color ordering. Two-wire protocols such as APA102 
(DotStar) and WS2801 are not currently in scope.
 
> [!WARNING]
> OPAL is currently being stabilized but is still in alpha phase. Changes may still occur before the
> specification is declared stable.
 
## Goals
 
- **Simplicity.** The protocol should be implementable from the specification alone, in a few
  hundred lines of code, without external libraries.
- **Low overhead.** Framing adds only a few bytes per message, leaving the bulk of the bandwidth
  for pixel data.
- **Transport-friendliness.** Designed for USB serial but framed in a way that works over any
  reliable byte stream.
- **Flexibility.** Runtime configuration of LED color order, protocol speed, and LED count per
  channel, without device-side DIP switches or configuration files.
- **Synchronized updates.** Multi-channel controllers can buffer data for several channels and
  commit all of them to the LEDs in a single atomic operation, eliminating inter-channel tearing.
- **Forward compatibility.** Version-aware handshake, reserved fields for future use, and a
  structured command range that allows extension without breaking older clients.

## Non-goals
 
- **Network transport.** OPAL does not define Ethernet-level addressing, multicasting, or
  discovery. For network-native addressable-light protocols, Art-Net and sACN (E1.31) are
  appropriate choices.
- **Fixture personality modeling.** OPAL addresses individual LEDs, not theatrical fixtures with
  named parameters (pan, tilt, gobo, etc.). For that, use DMX, Art-Net, or sACN.
- **Reliability layering.** OPAL assumes the underlying transport delivers bytes in order without
  loss. It does not define retransmission, acknowledgment, or session recovery.

## General Message Format
 
All OPAL messages share the following structure:
 
| START MARKER   | COMMAND                 | PAYLOAD LENGTH | PAYLOAD                    | CHECKSUM                |
|----------------|-------------------------|----------------|----------------------------|-------------------------|
| 1 byte (`0x00`)| 1 byte (`0x01` - `0xFF`)| 2 bytes        | variable (certain commands)| 2 bytes (`LSB` + `0x00`)|
 
**Start marker.** Every OPAL message begins with `0x00`. The start marker provides frame alignment
confirmation on a reliable byte stream. It is not a rigorous resynchronization mechanism. OPAL
assumes the transport guarantees in-order byte delivery.
 
**Command.** A single byte identifying the operation. Command values are organized into ranges
(see [Command Ranges](#command-ranges)).
 
**Payload length.** A 16-bit unsigned integer, little-endian, specifying the length of the payload
in bytes. Omitted for commands that carry no payload.
 
**Payload.** Command-specific data. Omitted for commands that carry no payload.
 
**Checksum.** Two bytes, little-endian. In OPAL 1.0, the low byte contains the modulo-256 sum of
`command` + `payload length bytes` + `payload bytes`. The high byte is reserved and MUST be `0x00`.
Implementations MAY upgrade to CRC-16 in a future version by populating both bytes; conforming
OPAL 1.0 receivers MUST validate only the low byte and ignore the high byte for version 1.0.
 
## Command Ranges
 
Commands are grouped by purpose. This organization reserves room for future extension without
collision.
 
| Range             | Purpose                                          |
|-------------------|--------------------------------------------------|
| `0x01` – `0x0F`   | Device queries (identity, configuration, status) |
| `0x10` – `0x1F`   | Reserved                                         |
| `0x20` – `0x2F`   | Device configuration                             |
| `0x30` – `0x3F`   | Reserved                                         |
| `0x40` – `0x4F`   | Pixel data operations                            |
| `0x50` – `0x5F`   | Reserved                                         |
| `0x60` – `0x6F`   | Control operations (update, reset, etc.)         |
| `0x70` – `0xFE`   | Reserved for future use                          |
| `0xFF`            | Reserved for vendor-specific extensions          |
 
## Channel Addressing Convention
 
Commands that operate on a single LED channel use a one-byte channel identifier with the following
convention:
 
- `0` through `N-1`: addresses the specified channel, where `N` is the number of channels reported
  by the device in its `INFO` response.
- `255`: broadcast sentinel. The command applies to all channels simultaneously.
- `N` through `254`: reserved. Implementations MUST silently reject messages specifying these values.

## Commands
 
### Get Info (`0x01`)
 
Queries the device for its identity and protocol compatibility. Typically used during connection
establishment. Devices MUST emit an `INFO` response when a serial connection is established.
 
| START MARKER | COMMAND | CHECKSUM |
|--------------|---------|----------|
| `0x00`       | `0x01`  | 2 bytes  |
 
**Response.** A single ASCII line prefixed with `INFO:` and terminated with a newline (`\n`):
 
```
INFO: DEVICE=<name> PROTOCOL=<version> FIRMWARE=<version> CHANNELS=<count> TRANSPORT=<transport>
```
 
Example:
 
```
INFO: DEVICE=Luminoctopus PROTOCOL=1 FIRMWARE=1.0.0 CHANNELS=8 TRANSPORT=USB
```
 
Clients MUST ignore unknown fields in the `INFO` response to remain forward-compatible with future
protocol versions that may add fields.
 
### Get Config (`0x02`)
 
Queries the device for its current configuration.
 
| START MARKER | COMMAND | CHECKSUM |
|--------------|---------|----------|
| `0x00`       | `0x02`  | 2 bytes  |
 
**Response.** A single ASCII line prefixed with `CONFIG:` and terminated with a newline (`\n`):
 
```
CONFIG: COLOR_ORDER=<order> SPEED=<speed> LEDS_PER_CHANNEL=<count>
```
 
Example:
 
```
CONFIG: COLOR_ORDER=GRB SPEED=800kHz LEDS_PER_CHANNEL=300
```
 
Clients MUST ignore unknown fields in the `CONFIG` response.
 
### Configure (`0x20`)
 
Sets the device's LED color order, protocol speed, and LED count per channel. Typically sent
during initialization, before any pixel data is streamed.
 
| START MARKER | COMMAND | PAYLOAD LENGTH | COLOR ORDER | SPEED   | LEDS PER CHANNEL | CHECKSUM |
|--------------|---------|----------------|-------------|---------|------------------|----------|
| `0x00`       | `0x20`  | `0x00` `0x04`  | 1 byte      | 1 byte  | 2 bytes          | 2 bytes  |
 
**Color Order values:**
 
| Value  | Order    | Value  | Order    | Value  | Order    |
|--------|----------|--------|----------|--------|----------|
| `0x00` | RGB      | `0x0A` | BRGW     | `0x14` | GWRB     |
| `0x01` | RBG      | `0x0B` | BGRW     | `0x15` | GWBR     |
| `0x02` | GRB      | `0x0C` | WRGB     | `0x16` | BWRG     |
| `0x03` | GBR      | `0x0D` | WRBG     | `0x17` | BWGR     |
| `0x04` | BRG      | `0x0E` | WGRB     | `0x18` | RGWB     |
| `0x05` | BGR      | `0x0F` | WGBR     | `0x19` | RBWG     |
| `0x06` | RGBW     | `0x10` | WBRG     | `0x1A` | GRWB     |
| `0x07` | RBGW     | `0x11` | WBGR     | `0x1B` | GBWR     |
| `0x08` | GRBW     | `0x12` | RWGB     | `0x1C` | BRWG     |
| `0x09` | GBRW     | `0x13` | RWBG     | `0x1D` | BGWR     |
 
Values `0x00` through `0x05` are 3-component (RGB) orderings; values `0x06` through `0x1D` are
4-component (RGBW) orderings.
 
**Speed values:**
 
| Value  | Speed              |
|--------|--------------------|
| `0x00` | WS2811 at 800 kHz  |
| `0x40` | WS2811 at 400 kHz  |
| `0x80` | WS2813 at 800 kHz  |
 
**LEDs per channel.** A 16-bit unsigned integer, little-endian. Maximum practical values depend on
the controller's memory and capabilities.
 
If the `Configure` command is not sent, implementations SHOULD default to GRB color order, 800 kHz
speed, and a device-specific default LED count.
 
### Assign Colors (`0x40`)
 
Sets the color data for all LEDs on one channel, or on all channels simultaneously (broadcast).
Data is buffered on the device; an `Update` command is required to commit buffered data to the
LEDs.
 
| START MARKER | COMMAND | PAYLOAD LENGTH | PAYLOAD                                                   | CHECKSUM |
|--------------|---------|----------------|-----------------------------------------------------------|----------|
| `0x00`       | `0x40`  | 2 bytes        | Channel number + 3 (or 4) bytes per LED's color           | 2 bytes  |
 
**Channel number.**
- `0` through `N-1`: assigns color data to the specified channel.
- `255`: broadcast. Assigns the same color data to all channels.
**Color bytes per LED.** Determined by the configured color order: 3 bytes for RGB-family orders,
4 bytes for RGBW-family orders. The byte order within each LED's data matches the configured
color order exactly; clients do not need to pre-swizzle.
 
**Payload length.** Equal to `1 + (LEDs_per_channel × bytes_per_LED)`.
 
### Fill Color (`0x41`)
 
Sets all LEDs on one channel, or all channels (broadcast), to a single uniform color. Data is
buffered; an `Update` command is required to commit.
 
| START MARKER | COMMAND | PAYLOAD LENGTH | PAYLOAD                                  | CHECKSUM |
|--------------|---------|----------------|------------------------------------------|----------|
| `0x00`       | `0x41`  | 2 bytes        | Channel number + R + G + B (+ W if RGBW) | 2 bytes  |
 
**Channel number.**
- `0` through `N-1`: fills the specified channel.
- `255`: broadcast. Fills all channels.
The `Fill Color` command is typically used to turn channels off (`R=0, G=0, B=0`) or to apply test
colors.
 
### Update (`0x60`)
 
Commits all buffered channel data (from `Assign Colors` and `Fill Color`) to the physical LEDs.
This command always affects all channels simultaneously, allowing synchronized multi-channel
updates without inter-channel tearing.
 
| START MARKER | COMMAND | CHECKSUM |
|--------------|---------|----------|
| `0x00`       | `0x60`  | 2 bytes  |
 
## Example Session
 
A typical client session driving 300 RGB LEDs per channel on an 8-channel device:
 
1. Client opens serial connection; device emits an `INFO:` line.
2. Client sends `Configure` with `COLOR_ORDER=GRB`, `SPEED=800kHz`, `LEDS_PER_CHANNEL=300`; device 
   emits a `CONFIG:` line.
3. Client sends `Assign Colors` for channel 0 with 900 bytes (300 × 3) of pixel data.
4. Client sends `Assign Colors` for channels 1 through 7 in the same manner.
5. Client sends `Update` to commit all eight channels simultaneously to the LEDs.
6. Client repeats steps 3–5 for each new frame.

For installations where all channels display the same content (mirror mode), steps 3–4 collapse
into a single `Assign Colors` with channel `255`.
 
## Conformance
 
An implementation is considered OPAL 1.0 conformant if it:
 
- Accepts all commands defined in this specification with the framing described.
- Validates the start marker, command range, payload length, and checksum on every received
  message.
- Rejects malformed messages without affecting the state of prior valid messages.
- Responds to `Get Info` with a properly formatted `INFO:` line containing at minimum the
  `DEVICE`, `PROTOCOL`, `FIRMWARE`, `CHANNELS`, and `TRANSPORT` fields.
- Honors the `0xFF` vendor-specific command range by either implementing it or rejecting it
  cleanly without side effects.
Implementations MAY add vendor-specific commands in the `0xFF` range; clients encountering such
commands from a device they do not recognize SHOULD ignore them.
 
## Versioning
 
OPAL uses a single integer version number, reported in the `INFO` response as the `PROTOCOL`
field. OPAL 1.0 corresponds to `PROTOCOL=1`.
 
Future versions will increment this number. Backward compatibility is a design goal: a client
speaking OPAL 1.0 SHOULD continue to work with devices advertising `PROTOCOL=2` or higher, because
new versions will add commands and fields rather than redefine existing ones. Clients SHOULD check
the `PROTOCOL` field in the `INFO` response and gracefully handle unknown versions.
 

## License

The contents of this repository are licensed under two complementary licenses:

- **Specification text** (this README and any files under `spec/`) is licensed under the
  [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
  You are free to share and adapt the specification for any purpose, including commercial use,
  provided you give appropriate credit to the original authors.

- **Reference code** (any source code in this repository, including files under `examples/`,
  `reference/`, or similar directories) is licensed under the
  [MIT License](https://opensource.org/licenses/MIT). You may use, modify, and distribute the
  code freely, including in commercial and proprietary products, provided the copyright notice
  is preserved.

See [`LICENSE-SPEC`](LICENSE-SPEC) and [`LICENSE-CODE`](LICENSE-CODE) for the full legal text
of each license.
 
## Contributing
 
Feedback, questions, and proposed extensions are welcome. Please open an issue on this repository
to discuss changes before submitting pull requests against the specification text.
 
## Authors
 
OPAL was designed and authored by Jean-Philippe Cô, [2026].