# Open Protocol for Addressable LEDs
### Version: 1.0.0-alpha.1

> [!WARNING]
> OPAL is currently being stabilized but is still in alpha phase. Changes may occur before the
> specification is officially declared stable.

OPAL is a lightweight binary protocol that allows interfacing with compatible LED controllers over
a reliable byte stream (typically, serial over USB).


## Scope

OPAL targets one-wire, addressable-LED chips in the **WS281x** family, including **WS2811**,
**WS2812**, **WS2812B**, **WS2813**, and their variants (e.g., **WS2814**, **WS2815**, **SK6812**). 
Both 3-component (RGB) and 4-component (RGBW) chips are supported.

> [!NOTE]
> Two-wire protocols such as **APA102** (DotStar) and **WS2801** are not currently in scope for
> this specification.

OPAL assumes the transport is trusted and delivers bytes in order without loss. It does not define
reliability, authentication, network addressing, or fixture personality modeling.


## Conventions

- **Key words**: **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are used as
  defined in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

- **Byte order**: All multi-byte integer fields are little-endian.

- **Strings**: UTF-8 encoded with a length prefix, not null-terminated.

- **Reserved fields and bits**: Senders MUST set them to zero; receivers MUST ignore their
  contents.

- **Versioning**: [Semantic versioning](https://semver.org/) is used. Major version updates
  indicate breaking changes; minor version updates add features without breaking existing clients.


## General Message Format

All OPAL messages, whether sent by a host (request) or by a device (response), share the following 
structure:

| START MARKER    | COMMAND                  | PAYLOAD LENGTH | PAYLOAD                     | CHECKSUM |
|-----------------|--------------------------|----------------|-----------------------------|----------|
| 1 byte (`0x00`) | 1 byte (`0x01` – `0xFF`) | 2 bytes        | variable (certain commands) | 2 bytes  |

**Start marker**: Every OPAL message begins with `0x00`. The start marker provides frame alignment
confirmation on a reliable byte stream. It is not a rigorous resynchronization mechanism.

**Command**: A single byte identifying the operation. The high bit distinguishes request commands
(host→device, `0x01`–`0x7F`) from response commands (device→host, `0x80`–`0xFF`). Command values
are further organized into ranges by purpose (see [Command Ranges](#command-ranges)).

**Payload length**: A 16-bit unsigned integer, little-endian, specifying the length of the payload
in bytes. Omitted for commands that carry no payload (see each command's definition).

**Payload**: Command-specific data. Omitted for commands that carry no payload.

**Checksum**: Two bytes, little-endian, containing a CRC-16/CCITT-FALSE over `command` +
`payload length` + `payload`. The start marker is not included in the CRC calculation.

­­**CRC-16/CCITT-FALSE parameters**: Polynomial: `0x1021`, initial value: `0xFFFF`, No input 
reflection, no output reflection, No final XOR.

> [!NOTE]
> Implementations can verify their CRC by computing it over the ASCII string `"123456789"`, which 
> MUST yield `0x29B1`.

Receivers MUST validate the CRC on every incoming message and MUST reject messages with invalid
CRCs by emitting an `ERROR` response with code `ERR_CRC_MISMATCH`. 

## Command Ranges

Commands are grouped by purpose. The high bit of the command byte distinguishes request
(host→device) from response/notification (device→host).

### Request commands (`0x01`–`0x7F`)

| Range           | Purpose                                                    |
|-----------------|------------------------------------------------------------|
| `0x01` – `0x0F` | Device queries (identity, configuration, status)           |
| `0x10` – `0x1F` | Reserved                                                   |
| `0x20` – `0x2F` | Device configuration                                       |
| `0x30` – `0x3F` | Reserved                                                   |
| `0x40` – `0x4F` | Pixel data operations                                      |
| `0x50` – `0x5F` | Reserved                                                   |
| `0x60` – `0x6F` | Control operations (update, reset, etc.)                   |
| `0x70` – `0x7F` | Vendor-specific extensions                                 |

### Response commands (`0x80`–`0xFF`)

| Range           | Purpose                                                    |
|-----------------|------------------------------------------------------------|
| `0x80` – `0x8F` | Query responses                                            |
| `0x90` – `0x9F` | Reserved                                                   |
| `0xA0` – `0xAF` | Reserved                                                   |
| `0xB0` – `0xBF` | Reserved                                                   |
| `0xC0` – `0xCF` | Reserved                                                   |
| `0xD0` – `0xDF` | Asynchronous notifications (reserved for future use)       |
| `0xE0` – `0xEF` | Errors                                                     |
| `0xF0` – `0xFF` | Vendor-specific responses                                  |

**Response pairing convention.** The response command for a given request is the request command
with the high bit set: a request with command `0x01` is paired with a response with command
`0x81`.


## Channel Addressing Convention

Commands that operate on a single LED channel use a one-byte channel identifier with the following
convention:

- `0` through `N-1`: addresses the specified channel, where `N` is the number of channels
  reported by the device in its INFO response.
- `255`: broadcast sentinel. The command applies to all channels simultaneously.
- `N` through `254`: invalid. Implementations MUST reject messages specifying these values by
  emitting an `ERROR` response with code `ERR_INVALID_PARAMETER`.


## Request Commands

### Request Device Information (`0x01`)

Queries the device for its identity and protocol compatibility. Typically sent during connection
establishment. Devices MUST emit an unsolicited INFO response (`0x81`) when a connection is
established.

| START MARKER | COMMAND | CHECKSUM |
|--------------|---------|----------|
| `0x00`       | `0x01`  | 2 bytes  |

**Response**: [`INFO`](#info-0x81).

### Request Device Configuration (`0x02`)

Queries the device for its current configuration.

| START MARKER | COMMAND | CHECKSUM |
|--------------|---------|----------|
| `0x00`       | `0x02`  | 2 bytes  |

**Response**: [`CONFIG`](#config-0x82).

### Configure Device (`0x20`)

Sets the LED color order, protocol speed, and LED count for one channel, or for all channels
simultaneously (broadcast). Typically sent during initialization, before any pixel data is
streamed.

| START MARKER | COMMAND | PAYLOAD LENGTH | CHANNEL | COLOR ORDER | SPEED  | LEDS ON CHANNEL | CHECKSUM |
|--------------|---------|----------------|---------|-------------|--------|-----------------|----------|
| `0x00`       | `0x20`  | `0x00` `0x05`  | 1 byte  | 1 byte      | 1 byte | 2 bytes         | 2 bytes  |

**Channel number**:
- `0` through `N-1`: configures the specified channel. Only supported by devices that advertise
  `CAP_PER_CHANNEL_CONFIG` in their INFO response.
- `255`: broadcast. Applies the same configuration to all channels simultaneously. Supported by
  all OPAL devices.

Devices that do not advertise `CAP_PER_CHANNEL_CONFIG` MUST respond with `ERR_UNSUPPORTED` when
the channel value is anything other than `255`. Clients SHOULD check the capability flag before
sending per-channel configuration to avoid unnecessary round-trips.

**Color Order values**:

| Value  | Order | | | | Value  | Order | | | | Value  | Order |
|--------|-------|-|-|-|--------|-------|-|-|-|--------|-------|
| `0x00` | RGB   | | | | `0x0A` | BRGW  | | | | `0x14` | GWRB  |
| `0x01` | RBG   | | | | `0x0B` | BGRW  | | | | `0x15` | GWBR  |
| `0x02` | GRB   | | | | `0x0C` | WRGB  | | | | `0x16` | BWRG  |
| `0x03` | GBR   | | | | `0x0D` | WRBG  | | | | `0x17` | BWGR  |
| `0x04` | BRG   | | | | `0x0E` | WGRB  | | | | `0x18` | RGWB  |
| `0x05` | BGR   | | | | `0x0F` | WGBR  | | | | `0x19` | RBWG  |
| `0x06` | RGBW  | | | | `0x10` | WBRG  | | | | `0x1A` | GRWB  |
| `0x07` | RBGW  | | | | `0x11` | WBGR  | | | | `0x1B` | GBWR  |
| `0x08` | GRBW  | | | | `0x12` | RWGB  | | | | `0x1C` | BRWG  |
| `0x09` | GBRW  | | | | `0x13` | RWBG  | | | | `0x1D` | BGWR  |

Values `0x00` through `0x05` are 3-component (RGB) orderings; values `0x06` through `0x1D` are
4-component (RGBW) orderings.

**Speed values**:

| Value  | Speed              |
|--------|--------------------|
| `0x00` | WS2811 at 800 kHz  |
| `0x40` | WS2811 at 400 kHz  |
| `0x80` | WS2813 at 800 kHz  |

**LEDs on channel**: A 16-bit unsigned integer, little-endian. Maximum practical values depend on
the controller's memory and capabilities.

If the `Configure` command is not sent, implementations SHOULD default to GRB color order,
800 kHz speed, and a device-specific default LED count.

**Response**: [`CONFIG`](#config-0x82) (confirming the applied configuration) or
[`ERROR`](#error-0xe0) if the requested configuration is not supported.

### Set Pixels (`0x40`)

Sets the color data for all LEDs on one channel, or on all channels simultaneously (broadcast).
Data is buffered on the device; a [`Show`](#show-0x60) command is required to commit buffered
data to the LEDs.

| START MARKER | COMMAND | PAYLOAD LENGTH | PAYLOAD                                         | CHECKSUM |
|--------------|---------|----------------|-------------------------------------------------|----------|
| `0x00`       | `0x40`  | 2 bytes        | Channel number + 3 (or 4) bytes per LED's color | 2 bytes  |

**Channel number**:
- `0` through `N-1`: assigns color data to the specified channel.
- `255`: broadcast. Assigns the same color data to all channels simultaneously.

**Color bytes per LED**: Determined by the configured color order: 3 bytes for RGB-family orders,
4 bytes for RGBW-family orders. The byte order within each LED's data matches the configured
color order exactly; clients do not need to pre-swizzle.

**Payload length**: Equal to `1 + (LEDs_per_channel × bytes_per_LED)`.

**Response**: None on success. Emits [`ERROR`](#error-0xe0) on failure.

### Fill Channel (`0x41`)

Sets all LEDs on one channel, or all channels (broadcast), to a single uniform color. Data is
buffered; a [`Show`](#show-0x60) command is required to commit.

| START MARKER | COMMAND | PAYLOAD LENGTH | PAYLOAD                                  | CHECKSUM |
|--------------|---------|----------------|------------------------------------------|----------|
| `0x00`       | `0x41`  | 2 bytes        | Channel number + R + G + B (+ W if RGBW) | 2 bytes  |

**Channel number**:
- `0` through `N-1`: fills the specified channel.
- `255`: broadcast. Fills all channels.

The `Fill Color` command is typically used to turn channels off (`R=0, G=0, B=0`) or to apply test
colors.

**Response**: None on success. Emits [`ERROR`](#error-0xe0) on failure.

### Show (`0x60`)

Commits buffered channel data (from `Assign Colors` and `Fill Color`) to the physical LEDs. Can
target a single channel or commit all channels atomically.

| START MARKER | COMMAND | PAYLOAD LENGTH | CHANNEL | CHECKSUM |
|--------------|---------|----------------|---------|----------|
| `0x00`       | `0x60`  | `0x00` `0x01`  | 1 byte  | 2 bytes  |

**Channel number**:
- `0` through `N-1`: commits only the specified channel. Only supported by devices that advertise
  `CAP_PER_CHANNEL_SHOW` in their INFO response.
- `255`: broadcast. Commits all channels simultaneously, guaranteeing synchronized multi-channel
  updates without inter-channel tearing. Supported by all OPAL devices.

Devices that do not advertise `CAP_PER_CHANNEL_SHOW` MUST respond with `ERR_UNSUPPORTED` when the
channel value is anything other than `255`. Clients SHOULD check the capability flag before
sending per-channel `Show` commands.

**Buffer persistence**: Each channel's buffer persists across `Show` commands and is overwritten
only by subsequent `Assign Colors` or `Fill Color` commands targeting that channel. This allows
clients to refresh channels at independent frame rates: a channel whose buffer is not rewritten
between `Show` commands continues to display the last committed data.

**Response**: None on success. Emits [`ERROR`](#error-0xe0) on failure.


## Response Commands

### INFO (`0x81`)

Sent in response to [`Request Device Information`](#request-device-information-0x01) or as an
unsolicited notification when a connection is established.

| START MARKER | COMMAND | PAYLOAD LENGTH | PAYLOAD   | CHECKSUM |
|--------------|---------|----------------|-----------|----------|
| `0x00`       | `0x81`  | 2 bytes        | see below | 2 bytes  |

**Payload structure**:

| Field                   | Size     | Description                                          |
|-------------------------|----------|------------------------------------------------------|
| Protocol version major  | 1 byte   | Major version of the OPAL protocol (e.g., `0x01`)    |
| Protocol version minor  | 1 byte   | Minor version of the OPAL protocol (e.g., `0x00`)    |
| Firmware version major  | 1 byte   | Device firmware major version                        |
| Firmware version minor  | 1 byte   | Device firmware minor version                        |
| Firmware version patch  | 1 byte   | Device firmware patch version                        |
| Channel count           | 1 byte   | Number of LED channels (`N`) supported by the device |
| Transport type          | 1 byte   | See transport values below                           |
| Reserved                | 1 byte   | MUST be `0x00`                                       |
| Capability flags        | 4 bytes  | Bitfield, little-endian; see capability bits below   |
| Device name length      | 1 byte   | Length in bytes of the following UTF-8 string        |
| Device name             | variable | UTF-8 encoded, not null-terminated                   |

**Transport type values**:

| Value  | Transport          |
|--------|--------------------|
| `0x00` | USB serial         |
| `0x01` | TCP (reserved)     |
| `0x02` | UDP (reserved)     |
| `0x03` | SPI (reserved)     |
| `0x04` | UART (reserved)    |

Other values are reserved for future transport bindings.

**Capability flags** (bit positions within the 32-bit little-endian field):

| Bit  | Name                     | Meaning                                                              |
|------|--------------------------|----------------------------------------------------------------------|
| 0    | `CAP_RGBW`               | Device supports 4-component (RGBW) color orders                      |
| 1    | `CAP_BROADCAST`          | Device supports channel `255` broadcast addressing                   |
| 2    | `CAP_PER_CHANNEL_CONFIG` | Device supports configuring channels individually via [`Configure Device`](#configure-device-0x20) |
| 3    | `CAP_PARTIAL_UPDATE`     | Reserved for future `Assign Range` command                           |
| 4    | `CAP_PER_CHANNEL_SHOW`   | Device supports committing channels individually via [`Show`](#show-0x60) |
| 5–31 | Reserved                 | MUST be `0` in senders; MUST be ignored by receivers                 |

Clients MUST ignore unknown capability bits to remain forward-compatible.

### CONFIG (`0x82`)

Sent in response to [`Request Device Configuration`](#request-device-configuration-0x02) or after
a successful [`Configure Device`](#configure-device-0x20) command.

| START MARKER | COMMAND | PAYLOAD LENGTH | PAYLOAD   | CHECKSUM |
|--------------|---------|----------------|-----------|----------|
| `0x00`       | `0x82`  | 2 bytes        | see below | 2 bytes  |

**Payload structure**:

The payload contains one **channel configuration entry** per channel, in channel-number order
(channel 0 first, channel `N-1` last). The number of entries is determined by the `Channel count`
field previously advertised in the INFO response; clients use the payload length to verify
consistency.

Each channel configuration entry has the following structure:

| Field            | Size    | Description                                        |
|------------------|---------|----------------------------------------------------|
| Color order      | 1 byte  | Encoding matches the `Configure` command           |
| Speed            | 1 byte  | Encoding matches the `Configure` command           |
| LED count        | 2 bytes | 16-bit unsigned integer, little-endian             |

### ERROR (`0xE0`)

Sent by the device to report a protocol or operational error. Errors are never silent — every
rejected message triggers an `ERROR` response.

| START MARKER | COMMAND | PAYLOAD LENGTH | PAYLOAD   | CHECKSUM |
|--------------|---------|----------------|-----------|----------|
| `0x00`       | `0xE0`  | 2 bytes        | see below | 2 bytes  |

**Payload structure**:

| Field              | Size     | Description                                                           |
|--------------------|----------|-----------------------------------------------------------------------|
| Error code         | 1 byte   | See error codes below                                                 |
| Offending command  | 1 byte   | Command byte of the message that caused the error; `0x00` if unknown  |
| Reserved           | 2 bytes  | MUST be `0x0000`                                                      |
| Message length     | 1 byte   | Length in bytes of the following UTF-8 string; `0x00` if no message   |
| Message            | variable | Optional UTF-8 string with implementation-specific detail             |

**Error codes**:

| Value           | Name                         | Meaning                                                   |
|-----------------|------------------------------|-----------------------------------------------------------|
| `0x00`          | `ERR_UNSPECIFIED`            | Generic error; details may be in the message field        |
| `0x01`          | `ERR_UNKNOWN_COMMAND`        | Command byte not recognized                               |
| `0x02`          | `ERR_INVALID_PAYLOAD_LENGTH` | Payload length does not match the command's expected size |
| `0x03`          | `ERR_CRC_MISMATCH`           | CRC-16 validation failed                                  |
| `0x04`          | `ERR_INVALID_PARAMETER`      | A parameter value is out of range                         |
| `0x05`          | `ERR_BUSY`                   | Device cannot accept the command at this time             |
| `0x06`          | `ERR_UNSUPPORTED`            | Command valid but unsupported by this device              |
| `0x07`–`0x7F`   | Reserved                     | Reserved for future specification versions                |
| `0x80`–`0xFF`   | Vendor-specific              | Available for vendor-specific error codes                 |

Clients MUST handle unknown error codes gracefully (e.g., by logging the numeric code and the
optional message).


## Example Session

A typical client session driving 300 RGB LEDs per channel on an 8-channel device:

1. Client opens serial connection; device emits an unsolicited `INFO` response (`0x81`).
2. Client sends `Configure Device` (`0x20`) with channel `255`, GRB color order, 800 kHz speed,
   and 300 LEDs per channel; device responds with `CONFIG` (`0x82`).
3. Client sends `Assign Colors` (`0x40`) for channel 0 with 900 bytes (300 × 3) of pixel data.
4. Client sends `Assign Colors` for channels 1 through 7 in the same manner.
5. Client sends `Show` (`0x60`) with channel `255` to commit all eight channels simultaneously to
   the LEDs.
6. Client repeats steps 3–5 for each new frame.

For installations where all channels display the same content (mirror mode), steps 3–4 collapse
into a single `Assign Colors` with channel `255`.


## Transport Bindings

OPAL 1.0 is defined over USB serial (or any equivalent reliable, in-order byte stream such as
UART). The message framing described in this document applies directly.

Future versions may define transport bindings for:

- **TCP**: OPAL framing applies directly; TCP provides reliability and in-order delivery.
- **UDP**: Requires adjusted framing; individual UDP datagrams would carry complete OPAL messages
  without the start marker, with reliability considerations documented separately.
- **SPI and other reliable local buses**: OPAL framing applies directly.

When a device advertises a transport via the `Transport type` field in its INFO response, that
value identifies the transport binding the device implements.


## Conformance

An implementation is considered OPAL 1.0 conformant if it:

- Accepts all request commands defined in this specification with the framing described.
- Validates the start marker, command range, payload length, and CRC-16 on every received message.
- Rejects malformed messages by emitting an appropriate `ERROR` response without affecting the
  state of prior valid messages.
- Responds to `Request Device Information` with a properly formatted `INFO` response containing
  all required fields.
- Emits an unsolicited `INFO` response on connection establishment.
- Ignores unknown capability flags and reserved fields per the [Conventions](#conventions)
  section.
- Honors the `0x70`–`0x7F` and `0xF0`–`0xFF` vendor-specific command ranges by either implementing
  them or rejecting them cleanly with `ERR_UNKNOWN_COMMAND`.

Implementations MAY add vendor-specific commands in the `0x70`–`0x7F` range and vendor-specific
responses in the `0xF0`–`0xFF` range. Clients encountering such commands from a device they do not
recognize SHOULD ignore them.


## Security Considerations

OPAL 1.0 provides no authentication, authorization, or encryption. It assumes the underlying
transport is trusted. This is a reasonable assumption for USB serial connections, where physical
access to the host implies the ability to control any connected device.

When OPAL is used over network transports (TCP, UDP) in future versions, applications SHOULD
consider:

- Restricting device access to trusted network segments.
- Using transport-layer security (TLS for TCP) if commands traverse untrusted networks.
- Validating device identity through out-of-band mechanisms before sending configuration commands.

The `ERROR` mechanism can leak information about device state and capabilities (e.g.,
`ERR_UNSUPPORTED` reveals which features a device lacks). For installations where this is a
concern, a future protocol revision may define an authenticated mode; OPAL 1.0 does not.


## License

This specification is licensed under the **Creative Commons Attribution-NoDerivatives 4.0
International License** ([CC BY-ND 4.0](https://creativecommons.org/licenses/by-nd/4.0/)).

You are free to:

- **Share**: copy and redistribute the specification in any medium or format for any purpose,
  including commercial use.

- **Implement**: create devices, software, tools, tutorials, and other works that use or
  describe the OPAL protocol. Implementation is not a derivative work of this specification.

Under the following conditions:

- **Attribution** — You must give appropriate credit to the original author, provide a link to
  the license, and indicate if changes were made.

- **No derivatives** — You may not distribute modified versions of this specification text.

Translations of the specification into other languages are permitted. Please contact the author
to coordinate and maintain accuracy.

See [`LICENSE`](LICENSE) for the full legal text.


## Contributing

Feedback, questions, and proposed extensions are welcome. Please open an issue on this repository
to discuss changes before submitting pull requests against the specification text.


## Author

OPAL was designed and authored by [Jean-Philippe Cô](https://djip.co), 2026.
