# Opalinx Protocol Specification
### Version: 1.0.0-alpha.1

> [!WARNING]
> **This is a prerelease specification and is not production-ready.** Breaking changes may occur
> before `1.0.0`.

## 1. Introduction

### 1.1. Purpose

**Opalinx** defines an implementation-independent protocol for communication between host software
and an addressable-LED controller. It carries device information, configuration, pixel data, output
control, and explicit operation results over a reliable, ordered, bidirectional byte stream.

The protocol is designed for applications that need more than an unacknowledged pixel stream. A host
can discover the controller's capabilities and current configuration, correlate requests with typed
responses, detect rejected operations, and confirm when staged pixel data has been physically
transmitted to the LEDs.

### 1.2. Applicability

Opalinx is intended for a logical point-to-point connection between one host and one LED controller.
The connection is typically serial over USB, but the core protocol is transport-independent and can
also operate over a reliable, ordered IP byte stream such as TCP. It is suitable when the host owns
rendering and pacing while the controller owns validation, buffering, and physical LED signaling.

Opalinx 1.0 does not itself define multi-controller distribution, routing, or IP discovery. This does
not preclude standard Opalinx bindings for IP transports or future protocol extensions for networked
operation. Opalinx does not replace DMX512, Art-Net, or sACN where console interoperability, lighting
universes, or network-wide distribution are required. Those protocols may coexist with Opalinx in a
controller or installation.

### 1.3. Protocol overview

The host initiates every operation. Requests and responses share one framed binary representation and
are normally correlated by a 16-bit transaction identifier. The host queries device information and
configuration, writes pixel data into per-channel staging buffers, and uses **Show** to commit staged
data to one or more physical outputs. The device validates every retained request and returns either
the operation's defined success response or a typed error when a nonzero transaction identifier was
provided.

Opalinx separates pixel preparation from display. This permits several channel buffers to be updated
before one coordinated Show operation and gives the host an explicit completion point for pacing.

### 1.4. Non-goals

Opalinx 1.0 does not define:

- device discovery or connection establishment;
- rendering, animation, color management, or user-interface behavior;
- electrical interfaces, connectors, power delivery, or LED power management;
- authentication, authorization, or encryption;
- discovery, routing, or distribution across multiple controllers; or
- the internal software, firmware, buffering, or scheduling architecture of an implementation.

## 2. Scope

**Opalinx** 1.0 controls devices that expose one or more `DATA_ONLY` outputs for clockless,
single-data-wire addressable LEDs using the `RGB8`, `RGBW8`, or `RGBCCT8` pixel format. The protocol
carries pixel values and selects a registered **output profile**; each device reports the pixel
formats and profiles it implements.

An output profile defines observable signaling behavior such as pulse encoding, nominal bit rate,
symbol timing, and reset or latch timing. It does not identify one LED product. Product-family names
such as WS2812B, WS2813, or SK6812 are informative compatibility references rather than definitions
of Opalinx behavior. Compatibility with a particular LED model depends on the selected output
profile, pixel format, component order, controller implementation, wiring, and the exact LED revision.

The separate [LED compatibility addendum](LED-COMPATIBILITY.md) records informative product mappings
without making them part of the normative protocol specification.


## 3. Protocol Model

### 3.1. Endpoint roles

An Opalinx session connects exactly one **host** to exactly one **device**. The host initiates every
protocol operation by sending a request. The device validates and executes requests and sends the
corresponding success or error responses. Opalinx 1.0 does not permit unsolicited device messages.

The host is responsible for application behavior, including rendering pixel values, selecting when
to update or display them, correlating responses, and pacing traffic within the limits reported by
the device. The device is responsible for protocol validation, configuration and pixel state,
request execution, physical LED signaling, and reporting observable results.

### 3.2. Channels and addressing

A device exposes one or more numbered LED **channels**. Each channel represents one independently
configurable physical LED output with its own configuration and pixel staging buffer. Requests can
address one channel or use the broadcast address to apply one operation to every channel for which
the request is valid.

Channel count and device capabilities are discovered through **INFO**. Current channel configuration
is discovered through **CONFIG**. A newly connected host therefore does not need prior knowledge of
the controller's topology or configuration.

### 3.3. Configuration, staging, and displayed output

Opalinx distinguishes three kinds of LED-control state:

- **Configuration state** defines each channel's pixel format, component order, output profile, and
  LED count.
- **Staging state** contains the pixel values most recently written with **Set Pixels** or
  **Fill Channel**.
- **Displayed output** is the pixel state most recently transmitted to the physical LEDs.

Pixel-data requests modify staging state but do not themselves update the physical outputs. A
**Show** request selects one channel or all channels and commits their staged values to the LEDs.
Staging state remains available after Show, allowing the same values to be displayed again or
partially overwritten before a later Show.

### 3.4. Transactions and results

Every request carries a 16-bit transaction identifier. A nonzero identifier establishes a
transaction whose result is reported in a correlated success or **ERROR** response. Identifier zero
selects fire-and-forget operation: the request is still validated and, if valid, executed in request
order, but the device sends no response. Fire-and-forget traffic therefore provides no evidence that
an individual request was received or accepted.

A response reports the result of one request; it does not create a new transaction. Responses may be
emitted out of request order unless a message defines a stronger ordering or barrier rule. The host
uses transaction identifiers, rather than response position, to associate results with requests.

### 3.5. Output pipeline and barriers

Physical LED transmission can take substantially longer than parsing a request. A device may have
one Show actively transmitting and one later Show pending. The active operation protects the pixel
and configuration state it is transmitting, while the pending operation protects the state of its
own selected channels. Requests that would exceed this bounded pipeline or mutate protected state
are rejected with **ERR_BUSY** as defined by the Show admission rules.

Successful Show completion is observable: **SHOW_ACK** is emitted only after transmission and the
required reset or latch interval have completed. **Reset** is an ordering barrier. It allows an
active Show to finish, cancels a pending Show, restores LED-control defaults, transmits the reset
output, and completes before subsequent requests are processed.

### 3.6. State lifetime

Protocol state does not all share the same lifetime:

| State | Initial or discovered value | Session boundary | Changed by |
|-------|-----------------------------|------------------|------------|
| Device identity and capabilities | Device-defined; reported by INFO | Persists | Firmware or hardware implementation |
| Channel configuration | Device-defined; reported by CONFIG | Persists | Configure Device, Reset |
| Network configuration | Stored device configuration | Persists | Configure Network |
| Pixel staging buffers | All zero at power-on | Persists | Set Pixels, Fill Channel, Configure Device, Reset |
| Displayed LED output | Device-defined at startup | Persists | Show, Reset |
| Transaction identifiers | No outstanding transactions | Ends | Requests, responses, Reset barrier |
| Active or pending Show | None at startup | Active transmission may finish; pending Show is canceled | Show, Reset |

A transport session ending does not imply a device reset. A new host must discover compatible device
information and current configuration and must not assume that staging buffers or displayed output
contain startup values.

## 4. Conventions

- **Key words**: **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are used as
  defined in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

- **Byte order**: All multi-byte integer fields are little-endian.

- **Strings**: UTF-8 encoded with a length prefix, not null-terminated.

## 5. Versioning and wire compatibility

Specification releases follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html). The
three protocol-version bytes at the start of `INFO` carry only the SemVer core `major.minor.patch`;
they do not encode prerelease or build metadata. These bytes identify the wire contract, not the
firmware or library release.

Prerelease versions provide no compatibility guarantees. Prerelease implementations are expected to
be developed and updated together. The current specification reports `1.0.0` on the wire.

A host MUST inspect the three-byte version preamble before parsing the version-specific remainder of
`INFO`. An `INFO` payload shorter than three bytes is malformed. If the major version is unsupported,
the host MUST stop parsing, reject the device, and send no state-changing requests. Within a supported
major version, feature support is determined by the messages, capability bits, and information records
defined for those features—not by comparing minor or patch numbers alone.


## 6. General Message Format

All **Opalinx** messages, whether sent by a host (request) or by a device (response), share the
following unencoded structure:

| TRANSACTION ID | MESSAGE IDENTIFIER   | PAYLOAD LENGTH | PAYLOAD  | CHECKSUM |
|----------------|----------------------|----------------|----------|----------|
| 2 bytes        | 1 byte               | 2 bytes        | variable | 2 bytes  |

### 6.1. Fields

 - **Transaction ID**: A 16-bit unsigned integer, little-endian, generated by the host for each
   request. The device MUST echo the same value in the corresponding response. `0x0000` is a
   reserved sentinel meaning "no correlation required"; hosts MAY use it for fire-and-forget
   requests. A device MUST NOT send any success or `ERROR` response to a request carrying
   `TxID = 0x0000`. A host MUST NOT reuse a nonzero transaction ID while a response to its earlier
   request could still arrive in the same session. Receipt of the response retires that transaction
   ID. Receipt of `RESET_ACK` also retires every nonzero transaction ID carried by a request that
   preceded the acknowledged Reset in the same session. A local timeout alone does not retire an ID.
   Before reusing an ID whose response may have been lost, the host MUST either receive `RESET_ACK`
   for a later Reset or end the session. Hosts that increment `TxID` sequentially MUST skip `0x0000`
   when wrapping, advancing from `0xFFFF` to an available nonzero value. Hosts using
   `TxID = 0x0000` accept that rejection and loss are silent; traffic requiring confirmation or error
   reporting MUST use a nonzero transaction ID. As an operational practice, a host sending sustained
   traffic with `TxID = 0x0000` can periodically send a request with a nonzero transaction ID and
   require its response to confirm that the session remains responsive. This does not confirm
   delivery of earlier fire-and-forget requests.

 - **Identifier**: A single byte identifying the message. `0x00` and `0x80` are reserved and
   MUST NOT be used as message identifiers; `0x00` serves as the sentinel value for "unknown"
   in the `ERROR` response's offending identifier field, and `0x80` is its paired response-space
   counterpart. The high bit distinguishes request messages (host→device, `0x01`–`0x7F`) from
   response messages (device→host, `0x81`–`0xFF`).

   An Opalinx 1.0 device MUST NOT send unsolicited frames; every device frame is a response to a
   host request.

 - **Payload length**: A 16-bit unsigned integer, little-endian, specifying the length of the
   payload in bytes. This field is always present, even for messages with an empty payload.

 - **Payload**: Message-specific data. May be empty for some messages.

 - **Checksum**: Two bytes, little-endian, containing a CRC-16/CCITT-FALSE over `transaction id` +
   `identifier` + `payload length` + `payload`.

### 6.2. CRC

The format used is **CRC-16/CCITT-FALSE** with the following parameters:

 - Polynomial: `0x1021`
 - Initial value: `0xFFFF`
 - No input reflection, no output reflection, no final XOR.

As a check value, CRC-16/CCITT-FALSE over the nine ASCII bytes `123456789` is `0x29B1`. When stored
in an Opalinx checksum field, this value is transmitted little-endian as bytes `B1 29`.

### 6.3. Encoding and Delimiting

**Opalinx** frames are encoded with
[Consistent Overhead Byte Stuffing (COBS)](https://en.wikipedia.org/wiki/Consistent_Overhead_Byte_Stuffing)
and terminated with a single `0x00` delimiter byte. The encoded frame is guaranteed not to contain
`0x00`.

### 6.4. Frame Size

The 16-bit payload-length field can represent payloads from 0 to 65535 bytes. Every device MUST
accept at least 10 request payload bytes, enough for one `RGBCCT8` `Set Pixels` operation (`5`
addressing bytes + `5` component bytes).

A host MUST accept response payloads up to 2048 bytes. An extension or vendor contract MAY require
a host using it to accept larger response payloads. A host MAY reject larger unsupported extension
or vendor payloads without treating the core protocol version as incompatible.

Each device advertises the largest request payload it accepts in the `max_payload_length` field of
the `INFO` response. This is a wire limit, not a statement about storage or processing architecture.
Clients MUST derive their chunk size from that field and MUST NOT send a request payload exceeding
the advertised value. The rejection and recovery rules for requests exceeding this limit are defined
in [Receiver Framing and Recovery](#65-receiver-framing-and-recovery).

For an endpoint required to accept payloads of at most `P` bytes, the maximum decoded frame length is
`D = P + 7`. The applicable encoded-frame limit, excluding the terminating delimiter, is:

`E = D + floor(D / 254) + 1`

This is the maximum COBS-encoded length of a `D`-byte frame. The complete transmitted frame may
therefore occupy `E + 1` bytes including its `0x00` delimiter. A device uses its advertised
`max_payload_length` as `P`. A host uses the largest response payload it is required or configured
to accept, which MUST be at least 2048. An endpoint supporting the full wire-format maximum uses
`P = 65535`; then `D = 65542`, `E = 65801`, and the complete delimited frame is at most 65802 bytes.

### 6.5. Receiver Framing and Recovery

Each endpoint MUST limit the bytes retained between delimiters to its applicable encoded-frame limit
`E`. The terminating delimiter is not part of that limit.

An empty run between delimiters is ignored. If a run exceeds the applicable encoded-frame limit, the
receiver MUST discard it through its terminating delimiter without decoding, responding, or changing
protocol or pixel state. Otherwise, the run is one candidate frame. Rejecting one candidate MUST NOT
prevent processing at the next delimiter.

A device processes each candidate in the following order. The first failing check determines the
result, and a request MUST NOT be dispatched until all structural checks pass:

1. **COBS and minimum size**: Silently discard a candidate that cannot be decoded or is shorter than
   seven decoded bytes.
2. **CRC**: Treat the final two decoded bytes as the checksum and calculate the CRC over all preceding
   bytes. Silently discard a mismatch.
3. **Identifier and direction**: Reject identifiers `0x00` and `0x80`–`0xFF` with
   `ERR_UNKNOWN_IDENTIFIER`.
4. **Declared length**: The decoded size MUST equal `7 + payload_length`; otherwise reject the request
   with `ERR_INVALID_PAYLOAD_LENGTH`.
5. **Advertised request limit**: Reject a retained request whose payload exceeds
   `max_payload_length` with `ERR_INVALID_PAYLOAD_LENGTH`.
6. **Message structure**: Reject a recognized request whose payload cannot have any structurally
   valid length for that message with `ERR_INVALID_PAYLOAD_LENGTH`.
7. **Parameters and state**: Apply the rules defined by the request.

A length ruled out solely by the message identifier is structurally invalid and fails at step 6. If
the payload has a structurally permitted length but its exact expected length depends on parsed field
values or current device state, a mismatch is a parameter failure at step 7 and produces
`ERR_INVALID_PARAMETER`.

An error response echoes the recovered transaction ID and offending identifier and is sent only for
a nonzero transaction ID. Candidates discarded before identifier validation receive no response.

A host MUST use the same bounded delimiter recovery and validate COBS structure, minimum size, CRC,
declared length, identifier and direction, and message-specific structure before accepting a response.
It reports failures locally, discards the candidate, continues at the next delimiter, and MUST NOT
send an `ERROR` response.

### 6.6. Request and Response Ordering

A device MUST evaluate complete requests in the order received. Each request is evaluated against
the protocol state resulting from all earlier accepted requests, including requests with transaction
ID zero.

Unless a message defines an ordering barrier, its response may be emitted whenever the operation
reaches its specified response point. Responses therefore need not follow request order; hosts MUST
correlate them by transaction ID. `Show` acknowledgement ordering and the `Reset` barrier are defined
by those messages.


## 7. Transport and Sessions

### 7.1. Core transport contract

**Opalinx** 1.0 is defined over a reliable, ordered, bidirectional byte transport connecting one host
to one device. Discovery, connection establishment, and transport-specific configuration are outside
the scope of this specification. A conforming transport MUST:

- deliver accepted bytes once, in order, without insertion or duplication in each direction;
- preserve the complete COBS-encoded frame stream, including `0x00` delimiters;
- expose connection loss as a transport failure rather than silently reconnecting a new peer into an
  existing Opalinx session;
- ensure that bytes received before a connection boundary cannot form a frame with bytes received
  after it.

CRC and delimiter recovery detect corruption and restore framing after a fault; they do not make an
unreliable transport reliable. Loss of a valid fire-and-forget request cannot be recovered by the
core protocol, and transaction IDs provide correlation rather than retransmission or deduplication.

### 7.2. Connection and session boundaries

One established transport connection is one Opalinx session. Transaction IDs and responses are
scoped to that session and have no meaning after its connection ends. An incomplete frame at a
connection boundary is discarded. A device MUST NOT deliver a response from an ended session to a
later session.

A connection boundary is not a device reset. Device configuration, staging pixel buffers, currently
displayed LED values, and diagnostic counters persist. If physical LED transmission has already
started, it MUST be allowed to finish, but its old-session acknowledgement is discarded. A pending
`Show` that has not started MUST be canceled and its acknowledgement discarded. This pending-Show
cancellation is the sole exception; no other accepted operation is rolled back.

Consequently, a newly connected host MUST NOT assume power-on defaults or known staging contents. It
MAY send INFO and CONFIG-query requests in either order, but MUST obtain compatible INFO before
sending configuration, pixel, Show, Reset, or vendor requests. It SHOULD request the current
configuration and MUST overwrite or reset pixel state before issuing a `Show` unless intentionally
preserving the previous session's content. A `Reset` remains the explicit operation for restoring
the LED-control state to device-defined defaults.

The standard transport identifiers define observable session boundaries as follows:

- `usb-cdc`: a session begins when the CDC data interface is opened (DTR asserted) and ends when DTR
  is deasserted, the USB device disconnects, or the interface is reset;
- `tcp`: a session is one established TCP connection;
- `bluetooth-spp`: a session is one established RFCOMM channel;
- `uart`: UART has no intrinsic open/close event. One session begins when the device initializes the
  link and continues until device/link reset, unless the transport provides an out-of-band boundary
  signal. Merely reopening a host serial handle does not create a device-observable new session. A
  UART overrun is a transport failure even if frame parsing later resynchronizes.


## 8. Message Ranges

Messages are grouped by purpose. The high bit of the identifier byte distinguishes requests
(host→device) from responses (device→host).

### 8.1. Requests (`0x01`–`0x7F`)

| Range           | Purpose                                                    |
|-----------------|------------------------------------------------------------|
| `0x00`          | Reserved (unknown identifier sentinel)                     |
| `0x01` – `0x0F` | Device queries (identity, configuration, status)           |
| `0x10` – `0x1F` | Reserved                                                   |
| `0x20` – `0x2F` | Device configuration                                       |
| `0x30` – `0x3F` | Reserved                                                   |
| `0x40` – `0x4F` | Pixel data operations                                      |
| `0x50` – `0x5F` | Control operations (show, reset)                           |
| `0x60` – `0x6F` | Reserved (mirrors `0xE0`–`0xEF`; MUST NOT be assigned)     |
| `0x70` – `0x7E` | Reserved                                                   |
| `0x7F`          | Standard namespaced vendor request envelope                 |

### 8.2. Responses (`0x81`–`0xFF`)

| Range           | Purpose                                                    |
|-----------------|------------------------------------------------------------|
| `0x80`          | Reserved (paired sentinel for `0x00`)                      |
| `0x81` – `0x8F` | Query responses                                            |
| `0x90` – `0x9F` | Reserved                                                   |
| `0xA0` – `0xAF` | Device configuration responses                             |
| `0xB0` – `0xBF` | Reserved                                                   |
| `0xC0` – `0xCF` | Pixel data responses                                       |
| `0xD0` – `0xDF` | Control responses                                          |
| `0xE0` – `0xEF` | Errors                                                     |
| `0xF0` – `0xFE` | Reserved                                                   |
| `0xFF`          | Standard namespaced vendor response envelope                |

**Response pairing convention.** The success response identifier for a given request is the
request identifier with the high bit set: a request with identifier `0x01` is paired with a
response with identifier `0x81`. Error responses always use `ERROR` (`0xE0`) regardless of the
originating request.

## 9. Channel Addressing Convention

Messages that operate on a single LED channel use a one-byte channel identifier with the following
convention:

- `0` through `N-1`: addresses the specified channel, where `N` is the number of channels
  reported by the device in its INFO response.
- `255`: broadcast. The message applies to all channels simultaneously.
- `N` through `254`: invalid. Implementations MUST reject messages specifying these values by
  emitting an `ERROR` response with code `ERR_INVALID_PARAMETER`.

`N` MUST be in the range `1`–`255`, so Opalinx 1.0 addresses at most 255 numbered channels
(`0`–`254`) on one device. The value `255` always means broadcast and MUST NOT be reinterpreted as a
numbered channel by an extension.

## 10. Request Messages

| Identifier | Request | Paired success response |
|------------|---------|-------------------------|
| `0x01` | [Request Device Information](#101-request-device-information-0x01) | [`INFO`](#111-info-0x81) (`0x81`) |
| `0x02` | [Request Device Configuration](#102-request-device-configuration-0x02) | [`CONFIG`](#112-config-0x82-0xa0) (`0x82`) |
| `0x03` | [Request Network Configuration](#103-request-network-configuration-0x03) | [`NETWORK_CONFIG`](#113-network_config-0x83-0xa1) (`0x83`) |
| `0x20` | [Configure Device](#104-configure-device-0x20) | [`CONFIG`](#112-config-0x82-0xa0) (`0xA0`) |
| `0x21` | [Configure Network](#105-configure-network-0x21) | [`NETWORK_CONFIG`](#113-network_config-0x83-0xa1) (`0xA1`) |
| `0x40` | [Set Pixels](#106-set-pixels-0x40) | [`SET_PIXELS_ACK`](#114-set_pixels_ack-0xc0) (`0xC0`) |
| `0x41` | [Fill Channel](#107-fill-channel-0x41) | [`FILL_CHANNEL_ACK`](#115-fill_channel_ack-0xc1) (`0xC1`) |
| `0x50` | [Show](#108-show-0x50) | [`SHOW_ACK`](#116-show_ack-0xd0) (`0xD0`) |
| `0x51` | [Reset](#1010-reset-0x51) | [`RESET_ACK`](#117-reset_ack-0xd1) (`0xD1`) |
| `0x7F` | [Namespaced Vendor Request](#1011-namespaced-vendor-request-0x7f) | [Namespaced Vendor Response](#118-namespaced-vendor-response-0xff) (`0xFF`) |

### 10.1. Request Device Information (`0x01`)

Queries the device for its identity and protocol compatibility. Clients MUST obtain and validate
INFO before sending state-changing or vendor requests in a new session. INFO and CONFIG queries may
otherwise be sent in either order.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | CHECKSUM |
|----------------|------------|----------------|----------|
| 2 bytes        | `0x01`     | `0x00` `0x00`  | 2 bytes  |

**Response**: [`INFO`](#111-info-0x81).

### 10.2. Request Device Configuration (`0x02`)

Queries the device for its current configuration.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | CHECKSUM |
|----------------|------------|----------------|----------|
| 2 bytes        | `0x02`     | `0x00` `0x00`  | 2 bytes  |

**Response**: [`CONFIG`](#112-config-0x82-0xa0) (`0x82`).

### 10.3. Request Network Configuration (`0x03`)

Queries the device's primary IPv4 interface. The request has no payload and requires a nonzero
transaction ID. A device that does not advertise `CAP_NETWORK_CONFIG` recognizes this request and
responds with `ERR_UNSUPPORTED`.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | CHECKSUM |
|----------------|------------|----------------|----------|
| 2 bytes        | `0x03`     | `0x00` `0x00`  | 2 bytes  |

**Response**: [`NETWORK_CONFIG`](#113-network_config-0x83-0xa1) (`0x83`).

### 10.4. Configure Device (`0x20`)

Sets the pixel format, component order, output profile, and LED count for all channels simultaneously.

| TX ID   | IDENTIFIER | PAYLOAD LENGTH | CHANNEL | PIXEL FORMAT | COMPONENT ORDER | OUTPUT PROFILE | LED COUNT | CHECKSUM |
|---------|------------|----------------|---------|--------------|-----------------|----------------|-----------|----------|
| 2 bytes | `0x20`     | `0x07` `0x00`  | 1 byte  | 1 byte       | 2 bytes         | 1 byte         | 2 bytes   | 2 bytes  |

**Channel number**:

- `0` through `N-1`: reserved for future per-channel configuration; devices MUST reject with
  `ERR_UNSUPPORTED`.
- `255`: broadcast. Applies the same configuration to all channels simultaneously.

**Pixel format values**:

| Value | Name | Components | Bytes per pixel |
|-------|------|------------|-----------------|
| `0x00` | `RGB8` | R, G, B | 3 |
| `0x01` | `RGBW8` | R, G, B, W | 4 |
| `0x02` | `RGBCCT8` | R, G, B, CW, WW | 5 |

Every component is an unsigned 8-bit intensity. `CW` and `WW` identify the cool-white and
warm-white components; products marketed as RGBWW or RGB+CCT use `RGBCCT8` when their five
independently addressable components have these semantics. A device MUST support `RGB8`; support
for the other formats is advertised by INFO record `0x07`. An unassigned format is rejected with
`ERR_INVALID_PARAMETER`; an assigned but unadvertised format is rejected with `ERR_UNSUPPORTED`.

**Component order** is an unsigned 16-bit little-endian value containing five 3-bit slots. Slot 0
occupies bits 0–2 and names the first component transmitted to each LED; slot 4 occupies bits 12–14
and names the last. Bit 15 is reserved and MUST be zero.

| Code | Component | Code | Component |
|------|-----------|------|-----------|
| `0` | R | `3` | W |
| `1` | G | `4` | CW |
| `2` | B | `5` | WW |
| `6` | Reserved | `7` | UNUSED |

For `RGB8`, slots 0–2 MUST contain R, G, and B exactly once and slots 3–4 MUST be UNUSED. For
`RGBW8`, slots 0–3 MUST contain R, G, B, and W exactly once and slot 4 MUST be UNUSED. For
`RGBCCT8`, all five slots MUST contain R, G, B, CW, and WW exactly once. Any other encoding is
rejected with `ERR_INVALID_PARAMETER`. For example, GRB is `0x7E81`, GRBW is `0x7681`, and
RGB-CW-WW is `0x5888`. This representation supports every meaningful permutation without assigning
a separate protocol value to each one.

**Output profile values** select the waveform generated between the controller and its LEDs.

| Value | Symbolic name | Interface | Bit cell | `T0H` | `T1H` | Minimum reset low |
|-------|---------------|-----------|----------|-------|-------|-------------------|
| `0x00` | `SINGLE_WIRE_PULSE_800K_T1` | `DATA_ONLY` | 1.10–1.40 µs | 250–450 ns | 550–850 ns | 80 µs |
| `0x01` | `SINGLE_WIRE_PULSE_400K_T1` | `DATA_ONLY` | 2.20–2.80 µs | 350–650 ns | 1.00–1.50 µs | 80 µs |
| `0x02` | `SINGLE_WIRE_PULSE_800K_T2` | `DATA_ONLY` | 1.10–1.40 µs | 250–450 ns | 700–900 ns | 300 µs |

All three profiles use one non-inverted data signal without a separate clock. Each bit begins high,
returns low within its bit cell, and is distinguished by its high-pulse duration. Pixel bytes are
transmitted most-significant bit first. `T0H` is the high duration for a zero bit and `T1H` is the
high duration for a one bit; the low duration is the remainder of the bit cell. The signal MUST
remain low between frames and for at least the listed reset time after the final bit. Every measured
bit cell, `T0H`, and `T1H` MUST fall within its inclusive range. The output interface is `DATA_ONLY`:
the profile defines no clock or redundant-data conductor. Voltage levels, drive strength, connectors,
and any additional product-specific conductors remain outside Opalinx.

Every conformant device MUST support profile `0x00`. Support for other assigned profiles is
advertised by the `Supported output profiles` INFO record. In Opalinx 1.0, every advertised profile
MUST be supported on every channel and for every advertised pixel format. A host MUST
only request a profile value that it understands and that the device advertises. If the record is
absent, the supported set is `{0x00}`.

CONFIG readers MUST preserve and expose unknown numeric output-profile values rather than rejecting
the response. A device rejects an unassigned value with `ERR_INVALID_PARAMETER` and an assigned but
unsupported value with `ERR_UNSUPPORTED`.

**LEDs on channel**: A 16-bit unsigned integer, little-endian. Devices MUST reject a value of
`0` or any value exceeding their capacity with `ERR_INVALID_PARAMETER`.

On success, `Configure Device` MUST clear the pixel buffer of every affected channel to all-zeros. A
broadcast `Configure Device` MUST be applied atomically: either all channels are reconfigured and
their buffers cleared, or no channel is modified.

**Response**: [`CONFIG`](#112-config-0x82-0xa0) (`0xA0`, confirming the applied configuration) or
[`ERROR`](#119-error-0xe0) if the requested configuration is not supported.

### 10.5. Configure Network (`0x21`)

Configures the device's primary IPv4 interface. This operation requires a nonzero transaction ID
and is available when INFO advertises `CAP_NETWORK_CONFIG`. It is independent of the transport
carrying the current Opalinx session and can configure an interface used by another protocol or by
a future Opalinx IP binding.

| Field              | Size     | Description |
|--------------------|----------|-------------|
| Addressing mode    | 1 byte   | `0x00` DHCP, `0x01` static IPv4 |
| IPv4 address       | 4 bytes  | Network byte order |
| Prefix length      | 1 byte   | `0` for DHCP; `1`–`32` for static IPv4 |
| Default gateway    | 4 bytes  | Network byte order; all zero means no gateway |
| Hostname length    | 1 byte   | Byte length, `0`–`63` |
| Hostname           | variable | ASCII hostname; empty selects the device-defined default |

The payload length is `11 + hostname_length`. In DHCP mode, the address, prefix length, and gateway
fields MUST all be zero. In static mode, the address MUST be a valid unicast IPv4 address and the
prefix length MUST be `1`–`32`. A nonzero gateway MUST be a valid unicast IPv4 address. A nonempty
hostname contains only ASCII letters, digits, and hyphens, begins and ends with a letter or digit,
and is at most 63 bytes. Invalid fields produce `ERR_INVALID_PARAMETER`.

A Configure Network request with transaction ID zero MUST NOT be applied and produces no response.
The device validates and persists the complete configuration atomically. A persistence failure
produces `ERR_DEVICE_FAULT` and leaves the previous stored configuration intact.

A successful request returns [`NETWORK_CONFIG`](#113-network_config-0x83-0xa1) (`0xA1`), confirming
that the configuration was accepted and stored, not that connectivity has been established. The
device sends that response using the previous interface configuration before applying any change
that could disrupt the current Opalinx transport. It then applies the new configuration and MAY end
the session. A host using that interface rediscovers or reconnects; a host using another transport
can poll Request Network Configuration until the active state changes.

### 10.6. Set Pixels (`0x40`)

Sets the color data for one channel or for all channels simultaneously (broadcast). Data is
buffered on the device; a [`Show`](#108-show-0x50) message is required to commit buffered data to the
LEDs.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | PAYLOAD   | CHECKSUM |
|----------------|------------|----------------|-----------|----------|
| 2 bytes        | `0x40`     | 2 bytes        | see below | 2 bytes  |

**Payload structure**:

| Field          | Size     | Description                                                    |
|----------------|----------|----------------------------------------------------------------|
| Channel number | 1 byte   | Target channel; see channel number description below           |
| LED offset     | 2 bytes  | Starting LED index within the channel, little-endian           |
| LED count      | 2 bytes  | Number of LEDs covered by this message, little-endian          |
| Pixel data     | variable | `LED_count × bytes_per_LED`; see component bytes per LED below |

**Channel number**:

- `0` through `N-1`: assigns color data to the specified channel.
- `255`: broadcast. Assigns the same color data to all channels simultaneously.

**Component bytes per LED**: Determined by the configured pixel format: 3 bytes for `RGB8`, 4 for
`RGBW8`, and 5 for `RGBCCT8`. Each LED's bytes represent component values in the channel's
configured component order. The resulting LED output MUST
match those wire-order values. A host using a different logical color layout converts it before
forming the request.

**Payload length**: At least `5`, consisting of the fixed fields followed by pixel data. A shorter
payload is structurally invalid and produces `ERR_INVALID_PAYLOAD_LENGTH`. After resolving the
target channel configuration, the exact length MUST equal
`1 + 2 + 2 + (LED_count × bytes_per_LED)`; a mismatch produces `ERR_INVALID_PARAMETER`.

`Set Pixels` messages MUST satisfy all of the following; violations MUST be rejected with
`ERR_INVALID_PARAMETER`:

- `LED_count` MUST be greater than zero.
- `LED_offset` MUST be less than the configured number of LEDs on the target channel.
- `LED_offset + LED_count` MUST be less than or equal to the configured number of LEDs on the
  target channel.
- For broadcast pixel operations (`Channel number = 255`), every targeted channel MUST have the
  same configured pixel format and component-order value, and each targeted channel's LED count MUST be at
  least `LED_offset + LED_count`; otherwise the message MUST be rejected.

Any rejected `Set Pixels` message MUST be rejected atomically; no channel's buffer may be modified.
A rejected request with a nonzero transaction ID produces one `ERROR` response.

**Response**: Emits [`SET_PIXELS_ACK`](#114-set_pixels_ack-0xc0) on success if `TxID ≠ 0x0000`; no
response if `TxID = 0x0000`. Emits [`ERROR`](#119-error-0xe0) on failure only if `TxID ≠ 0x0000`.

### 10.7. Fill Channel (`0x41`)

Sets all LEDs on one channel, or all channels (broadcast), to a single uniform color. Data is
buffered; a [`Show`](#108-show-0x50) message is required to commit.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | PAYLOAD   | CHECKSUM |
|----------------|------------|----------------|-----------|----------|
| 2 bytes        | `0x41`     | 2 bytes        | see below | 2 bytes  |

**Payload structure**:

| Field          | Size   | Description                                                            |
|----------------|--------|------------------------------------------------------------------------|
| Channel number | 1 byte | Target channel; see channel addressing convention                      |
| Color byte 1   | 1 byte | First component in the channel's configured wire order                 |
| Color byte 2   | 1 byte | Second component in the channel's configured wire order                |
| Color byte 3   | 1 byte | Third component in the channel's configured wire order                 |
| Color byte 4   | 1 byte | Fourth component; present for `RGBW8` and `RGBCCT8`                    |
| Color byte 5   | 1 byte | Fifth component; present only for `RGBCCT8`                            |

The color is supplied in the channel's configured wire order — exactly as for
[`Set Pixels`](#106-set-pixels-0x40) — and the resulting output applies those component values to every
LED. A host using a different logical color layout converts it before forming the request. For
example, on a `GRB` channel the three bytes represent G, R, B in that order.

**Payload length**: The structurally permitted lengths are `4`, `5`, and `6`; any other length produces
`ERR_INVALID_PAYLOAD_LENGTH`. After resolving the target channel configuration, the length MUST be
`4` for `RGB8`, `5` for `RGBW8`, or `6` for `RGBCCT8`; a mismatch produces `ERR_INVALID_PARAMETER`.

**Channel number**:

- `0` through `N-1`: Fills the specified channel.
- `255` (broadcast): Fills all channels simultaneously.

`Fill Channel` MUST be rejected with `ERR_INVALID_PARAMETER` if the payload has a structurally
permitted length but does not match the target configuration, including when:

- Its length does not match the selected channel's configured component count.
- For broadcast, the targeted channels do not all have the same configured pixel format and
  component-order value.
  Matching component counts alone are insufficient because the same bytes are written verbatim to
  every channel.

Any rejected `Fill Channel` message MUST be rejected atomically; no channel's buffer may be
modified as a result of a rejected message.

`Fill Channel` can be used to turn channels off (all components set to `0`) or to apply test colors.

**Response**: Emits [`FILL_CHANNEL_ACK`](#115-fill_channel_ack-0xc1) on success if `TxID ≠ 0x0000`;
no response if `TxID = 0x0000`. Emits [`ERROR`](#119-error-0xe0) on failure only if `TxID ≠ 0x0000`.

### 10.8. Show (`0x50`)

Commits buffered channel data (from `Set Pixels` and `Fill Channel`) to all physical LED channels as
one coordinated output operation.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | PAYLOAD                  | CHECKSUM |
|----------------|------------|----------------|--------------------------|----------|
| 2 bytes        | `0x50`     | `0x01` `0x00`  | Channel number (1 byte)  | 2 bytes  |

**Channel number**:

- `0` through `N-1`: reserved for future per-channel transmission; devices MUST reject with
  `ERR_UNSUPPORTED`.
- `255`: broadcast. Captures and commits all channels as one coordinated output operation. Every
  channel MUST transmit the data captured for that Show; no channel may transmit data captured by a
  different Show as part of the operation. Physical timing skew between channels is device-defined.

**Buffer persistence**: Each channel's buffer is initialized to all-zeros at power-on and persists
across `Show` messages, being overwritten only by subsequent `Set Pixels` or `Fill Channel`
messages targeting that channel, or cleared by a successful `Configure Device`.

**Response**: Emits [`SHOW_ACK`](#116-show_ack-0xd0) after every channel's transmission and required
reset/latch interval complete if `TxID ≠ 0x0000`; no response if `TxID = 0x0000`. Emits
[`ERROR`](#119-error-0xe0) on failure only if
`TxID ≠ 0x0000`. Hosts that use a non-zero `TxID` for `Show` and wait for `SHOW_ACK` before
issuing the next `Show` are guaranteed never to receive `ERR_BUSY`. `SHOW_ACK` provides an observable
completion boundary for pacing under [Frame Pipelining](#109-frame-pipelining); a Show with
`TxID = 0x0000` provides no completion or rejection feedback.

### 10.9. Frame Pipelining

Opalinx 1.0 supports one active `Show` and one pending `Show`. A third `Show` is rejected with
`ERR_BUSY`.

Accepting a `Show` logically captures the staged frame for that operation. Once captured, later
requests cannot alter it. This is an observable frame-isolation guarantee, not a storage or
processing requirement.

The admission table uses `IDLE` for no active Show, `ACTIVE` for one active Show, and
`ACTIVE_PENDING` for one active and one pending Show. It applies after all request-specific
validation. Rejection does not change pipeline or pixel state.

An implementation MAY complete Show synchronously. If it does not evaluate another request until
that Show completes, the `ACTIVE` and `ACTIVE_PENDING` states are not externally observable, and no
pending-Show storage is required.

| Request | `IDLE` | `ACTIVE` | `ACTIVE_PENDING` |
|---------|--------|----------|------------------|
| `Set Pixels`, `Fill Channel` | Accept | Accept for the next frame | `ERR_BUSY` |
| `Show` | Start and enter `ACTIVE` | Capture as pending and enter `ACTIVE_PENDING` | `ERR_BUSY` |
| `Configure Device` | Accept | `ERR_BUSY` | `ERR_BUSY` |
| `Reset` | Accept | Accept; run after active Show | Accept; cancel pending Show and run after active Show |
| Query requests | Accept | Accept | Accept |

A vendor request MUST NOT violate core Opalinx state or pipelining guarantees. If it accesses state
governed by this table, its vendor contract MUST identify the equivalent core operation and the
request MUST follow that operation's admission rule. Other vendor requests define their own
admission rules.

An active Show completes after every affected channel has completed physical transmission, including
the reset/latch interval required by its selected output profile. When it completes:

- with no pending Show, the device enters `IDLE`;
- with a pending Show, the device starts it and enters `ACTIVE`.

Only after that transition does the device emit `SHOW_ACK` for the completed Show, if its transaction
ID is nonzero. Show acknowledgements are emitted in accepted order.

### 10.10. Reset (`0x51`)

Restores the LED-control state to its device-defined defaults: resets all channel configurations,
clears all channel buffers to zero, and outputs zeros to the physical LEDs.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | CHECKSUM |
|----------------|------------|----------------|----------|
| 2 bytes        | `0x51`     | `0x00` `0x00`  | 2 bytes  |

**Response**: With a nonzero transaction ID, [`RESET_ACK`](#117-reset_ack-0xd1) after LED transmission
completes, or [`ERROR`](#119-error-0xe0) on failure. A Reset carrying transaction ID zero produces no
response.

Reset MUST be accepted while a Show is actively transmitting. The active Show is allowed to
complete, including its reset/latch interval, before Reset begins. If a pending Show has not started,
Reset MUST cancel it and discard its acknowledgement. The device then restores its defaults and
transmits the resulting all-zero output before completing Reset.

After accepting a Reset, the device MUST complete it before processing any subsequent request. If
the Reset has a nonzero transaction ID, `RESET_ACK` is therefore emitted before any response to a
later request. A Reset with transaction ID zero imposes the same ordering barrier despite producing
no response.

Before emitting `RESET_ACK`, the device MUST emit every response required for a request evaluated
before that Reset. After emitting `RESET_ACK`, it MUST NOT emit such a response. Consequently,
receipt of `RESET_ACK` retires all transaction IDs from requests preceding that Reset. An `ERROR`
rejecting Reset does not retire any other transaction ID, and a Reset with transaction ID zero
provides no observable transaction-ID reclamation point. This reclamation path is destructive: it
also restores the LED-control state to its device-defined defaults as described above.

### 10.11. Namespaced Vendor Request (`0x7F`)

Carries an extension command without consuming a globally shared identifier. Its payload is:

| Field            | Size      | Description                                       |
|------------------|-----------|---------------------------------------------------|
| Namespace length | 1 byte    | Namespace length `3`–`63`                         |
| Namespace        | variable  | Lowercase ASCII reverse-DNS name                  |
| Command ID       | 2 bytes   | Vendor-assigned identifier, little-endian         |
| Vendor payload   | remaining | Defined by the namespace and command; may be empty |

A namespace consists of at least two dot-separated labels and is 3–63 bytes long. Each label MUST
begin and end with a lowercase ASCII letter or digit; interior characters may also be hyphens. Empty
labels are forbidden. The owner of a DNS name controls its reverse-DNS namespace, such as
`com.example.lighting`. Command IDs are assigned independently within each namespace.

A device that does not implement the namespace or command MUST return `ERR_UNSUPPORTED`. Invalid
envelope structure produces `ERR_INVALID_PAYLOAD_LENGTH`; an invalid namespace produces
`ERR_INVALID_PARAMETER`. With a nonzero transaction ID, success MUST produce a
[`Namespaced Vendor Response`](#118-namespaced-vendor-response-0xff). With transaction ID zero, neither
success nor failure produces a response. A vendor contract requiring confirmation MUST forbid
fire-and-forget use and require a nonzero transaction ID.

All vendor-defined requests use this envelope. The reserved request and response ranges MUST NOT be
used as private extension points.

## 11. Response Messages

| Identifier | Response | Request or condition |
|------------|----------|----------------------|
| `0x81` | [`INFO`](#111-info-0x81) | [Request Device Information](#101-request-device-information-0x01) |
| `0x82` | [`CONFIG`](#112-config-0x82-0xa0) | [Request Device Configuration](#102-request-device-configuration-0x02) |
| `0x83` | [`NETWORK_CONFIG`](#113-network_config-0x83-0xa1) | [Request Network Configuration](#103-request-network-configuration-0x03) |
| `0xA0` | [`CONFIG`](#112-config-0x82-0xa0) | [Configure Device](#104-configure-device-0x20) |
| `0xA1` | [`NETWORK_CONFIG`](#113-network_config-0x83-0xa1) | [Configure Network](#105-configure-network-0x21) |
| `0xC0` | [`SET_PIXELS_ACK`](#114-set_pixels_ack-0xc0) | [Set Pixels](#106-set-pixels-0x40) |
| `0xC1` | [`FILL_CHANNEL_ACK`](#115-fill_channel_ack-0xc1) | [Fill Channel](#107-fill-channel-0x41) |
| `0xD0` | [`SHOW_ACK`](#116-show_ack-0xd0) | [Show](#108-show-0x50) |
| `0xD1` | [`RESET_ACK`](#117-reset_ack-0xd1) | [Reset](#1010-reset-0x51) |
| `0xE0` | [`ERROR`](#119-error-0xe0) | Rejected request with a nonzero transaction ID |
| `0xFF` | [Namespaced Vendor Response](#118-namespaced-vendor-response-0xff) | [Namespaced Vendor Request](#1011-namespaced-vendor-request-0x7f) |

### 11.1. INFO (`0x81`)

Sent in response to [`Request Device Information`](#101-request-device-information-0x01).

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | PAYLOAD   | CHECKSUM |
|----------------|------------|----------------|-----------|----------|
| 2 bytes        | `0x81`     | 2 bytes        | see below | 2 bytes  |

**Payload structure**:

| Field                   | Size     | Description                                                 |
|-------------------------|----------|-------------------------------------------------------------|
| Protocol version major  | 1 byte   | Major version of the **Opalinx** protocol                      |
| Protocol version minor  | 1 byte   | Minor version of the **Opalinx** protocol                      |
| Protocol version patch  | 1 byte   | Patch version of the **Opalinx** protocol                      |
| Channel count           | 1 byte   | Number of 1.0-addressable channels (`N`), `1`–`255`          |
| Capability flags        | 1 byte   | Standard capability bitfield; see below                     |
| Max payload length      | 2 bytes  | Largest accepted request payload, little-endian; MUST be ≥ 9 |
| Information records     | variable | TLV records containing identity and extension information   |

The fixed prefix is exactly 7 bytes. Firmware identity and descriptive strings are information records
so future metadata does not enlarge or reorder the compatibility prefix.

**Capability flags**:

| Bit | Name                 | Meaning when set |
|-----|----------------------|------------------|
| 0   | `CAP_NETWORK_CONFIG` | Standard primary-IPv4 query and configuration are supported |
| 1–7 | Unassigned           | Senders emit zero; receivers ignore |

A device with `CAP_NETWORK_CONFIG` clear recognizes Request Network Configuration and Configure
Network but rejects them with `ERR_UNSUPPORTED`. Capability bits describe optional standard
operations; structured capability data uses an information record.

#### 11.1.1. INFO extensions

Immediately after the 7-byte fixed prefix, the remainder of the INFO payload contains
type-length-value (TLV) information records. The complete INFO payload, including the fixed prefix,
MUST NOT exceed 2048 bytes. Each record has this structure:

| Field  | Size     | Description                                      |
|--------|----------|--------------------------------------------------|
| Type   | 1 byte   | Extension type identifier                        |
| Length | 2 bytes  | Value length in bytes, unsigned little-endian    |
| Value  | variable | Exactly `length` bytes                           |

Type assignments are divided into these ranges:

| Range           | Purpose                                                     |
|-----------------|-------------------------------------------------------------|
| `0x00`          | Reserved; senders MUST NOT emit                              |
| `0x01`–`0x07`   | Standard Opalinx 1.0 information records                      |
| `0x08`–`0xFE`   | Reserved for future standard Opalinx information records      |
| `0xFF`          | Standard namespaced vendor-information envelope               |

The outer INFO payload length terminates the extension area; no end marker or padding is permitted.
Every record, including an unknown record, MUST fit completely within that payload. A truncated TLV
header, a value shorter than its declared length, or trailing bytes that cannot form a complete TLV
make the INFO response malformed and MUST cause the host to reject it.

Hosts MUST parse through the entire information-record area and MUST skip unknown record types using their
declared lengths. Unknown standard or vendor extensions MUST NOT make an otherwise compatible device
fail discovery. A sender MUST NOT repeat an extension type unless that extension's definition
explicitly permits repetition. A host MUST reject duplicate instances of a known non-repeatable type;
it MAY preserve or expose unknown records, including repeated unknown types, for diagnostics.

The Opalinx 1.0 standard records are:

| Type   | Name                | Requirement | Value                                             |
|--------|---------------------|-------------|---------------------------------------------------|
| `0x01` | Firmware version    | Required    | Exactly 3 bytes: major, minor, patch              |
| `0x02` | Device name         | Optional    | UTF-8, `1`–`255` bytes; omission means no name    |
| `0x03` | Hardware revision   | Optional    | UTF-8, `1`–`63` bytes                             |
| `0x04` | Hardware platform   | Optional    | UTF-8, `1`–`63` bytes                             |
| `0x05` | Transport           | Optional    | UTF-8 identifier, `1`–`63` bytes                  |
| `0x06` | Supported output profiles | Conditional | Complete ascending set of accepted one-byte output-profile values |
| `0x07` | Pixel-format capacities | Required | Repeated 3-byte entries: pixel format followed by maximum LEDs per channel as little-endian 16-bit |
| `0xFF` | Vendor information  | Optional    | Namespaced vendor-information envelope            |

Every required record MUST occur exactly once. A known standard record with an invalid length or a
duplicate known record makes INFO malformed. Record order has no meaning; senders SHOULD emit
standard records in ascending type order for deterministic diagnostics. Adding a standard record
within the INFO payload limit is additive and does not change the offsets or interpretation of the
fixed prefix. Changing, removing, or reordering a fixed field requires an incompatible protocol
revision.

Every standard INFO string record MUST contain well-formed UTF-8. An invalid UTF-8 sequence makes
the INFO response malformed and the host MUST reject it. Length limits count encoded bytes; no
Unicode normalization form is required. Records defined as opaque data are unaffected.

When present, `hardware_revision`, `hardware_platform`, and `transport` are non-empty UTF-8 strings
of at most 63 bytes. Omission means that the information is unavailable. Hardware revision is
manufacturer-defined; examples include `Rev A` and `1.2`.

The optional `hardware_platform` field identifies the processor, module, or computing platform on which the
controller firmware runs. Examples include `ESP32-P4`, `Teensy 4.1`, and `RP2040`. It is
informational and does not imply particular capabilities; clients MUST accept and expose unknown
values.

The optional `transport` field identifies the active transport carrying the current Opalinx connection. It
does not identify intermediate adapters: a controller receiving Opalinx through a UART reports
`uart`, even when the host reaches that UART through a USB-to-UART bridge. Standard transport
identifiers are lowercase ASCII:

| Identifier      | Transport                                      |
|-----------------|------------------------------------------------|
| `uart`          | Hardware UART                                  |
| `usb-cdc`       | USB Communications Device Class serial         |
| `tcp`           | Transmission Control Protocol                  |
| `bluetooth-spp` | Bluetooth Serial Port Profile / RFCOMM         |

Future specifications may define additional identifiers. Vendor-defined transports SHOULD use a
namespaced identifier such as `vendor.example/custom-link`. Clients MUST accept and expose unknown
transport identifiers and MUST NOT reject a device because its transport is unrecognized. The
transport string identifies the binding only; it MUST NOT contain link speed, driver, adapter, or
other diagnostic details.

Every device supports baseline output profile `0x00`. Absence of record `0x06` means that `0x00` is
the device's complete supported set. A device that accepts any other output-profile value in
`Configure Device` MUST include record `0x06`; when present, the record MUST list the complete
supported set, including `0x00`, in ascending numeric order. Values are one byte each, the record
MUST be non-empty, and no value may repeat. Unknown values are retained as numbers; their presence
does not make INFO incompatible.

The pixel-format-capacities record advertises both format support and the largest LED count accepted
by `Configure Device` for each format. Its length MUST be a nonzero multiple of 3. Entries MUST be
unique and sorted by ascending pixel-format value. Each maximum MUST be in the range `1`–`65535`.
The record MUST include `RGB8`; it includes `RGBW8` or `RGBCCT8` only when supported. Unknown formats
are preserved for diagnostics but are not selected by a host that does not understand them.

The `0xFF` vendor-information value contains namespace length (1 byte), namespace, vendor record ID
(2 bytes little-endian), and vendor data. Namespace syntax and ownership match the Namespaced Vendor
Request. Type `0xFF` MAY repeat because each `(namespace, vendor record ID)` pair is independently
identified; a sender MUST NOT repeat the same pair. Types `0x08`–`0xFE` MUST NOT be used as private
extension points.

A device reports `ERR_INVALID_PARAMETER` when a `Configure Device` request specifies an LED count
of zero or one that exceeds the matching capacity in record `0x07`.

### 11.2. CONFIG (`0x82`, `0xA0`)

Sent in response to [`Request Device Configuration`](#102-request-device-configuration-0x02)
(`0x82`) or after a successful [`Configure Device`](#104-configure-device-0x20) message (`0xA0`).
Both identifiers share the same payload structure.

| TRANSACTION ID | IDENTIFIER    | PAYLOAD LENGTH | PAYLOAD   | CHECKSUM |
|----------------|---------------|----------------|-----------|----------|
| 2 bytes        | `0x82`/`0xA0` | 2 bytes        | see below | 2 bytes  |

**Payload structure**:

The payload contains one **channel configuration entry** per channel, in channel-number order
(channel 0 first, channel `N-1` last).

INFO and CONFIG have separate roles: INFO describes device identity, topology, capabilities, and
limits; CONFIG describes mutable per-channel output settings. CONFIG intentionally does not repeat a
channel-count field because its entry count is unambiguously derived from its payload length.

A CONFIG payload is structurally valid when its length is a nonzero multiple of six; it contains
`payload_length / 6` entries and can be parsed without INFO. When valid INFO from the same session is
available, the CONFIG entry count MUST equal INFO `channel_count`; otherwise the host MUST reject the
CONFIG as inconsistent and MUST NOT replace cached configuration. INFO cached across a connection
boundary MUST NOT be used for this check.

Each entry has the following structure:

| Field            | Size    | Description                                           |
|------------------|---------|-------------------------------------------------------|
| Pixel format     | 1 byte  | Encoding matches the `Configure Device` message       |
| Component order  | 2 bytes | Unsigned little-endian packed component slots         |
| Output profile   | 1 byte  | Encoding matches the `Configure Device` message       |
| LED count        | 2 bytes | 16-bit unsigned integer, little-endian                |

Each CONFIG LED count is in the range `1`–`65535`. The number of entries is exactly the INFO
`channel_count`; therefore a conformant 1.0 CONFIG payload contains `1`–`255` entries and is at most
1530 bytes.

### 11.3. NETWORK_CONFIG (`0x83`, `0xA1`)

Sent in response to [`Request Network Configuration`](#103-request-network-configuration-0x03)
(`0x83`) or after a successful [`Configure Network`](#105-configure-network-0x21) (`0xA1`). Both
identifiers share the same payload structure.

| Field                       | Size     | Description |
|-----------------------------|----------|-------------|
| Status flags                | 1 byte   | See below |
| Configured IPv4 address     | 4 bytes  | Network byte order; zero in DHCP mode |
| Configured prefix length    | 1 byte   | `0` in DHCP mode; otherwise `1`–`32` |
| Configured default gateway  | 4 bytes  | Network byte order; zero means none |
| Active IPv4 address         | 4 bytes  | Network byte order; zero when unavailable |
| Active prefix length        | 1 byte   | `0` when unavailable; otherwise `1`–`32` |
| Active default gateway      | 4 bytes  | Network byte order; zero means none |
| Effective hostname length   | 1 byte   | ASCII byte length, `1`–`63` |
| Effective hostname          | variable | Hostname currently selected by the device |
| Link-layer address length   | 1 byte   | `0`–`32`; zero means unavailable |
| Link-layer address          | variable | Interface-specific binary address; Ethernet normally uses a 6-byte MAC |

The payload length is `21 + hostname_length + link_address_length`.

| Bit | Meaning |
|-----|---------|
| 0   | DHCP is configured |
| 1   | Physical or logical network link is available |
| 2   | An active IPv4 address is assigned |
| 3–7 | Reserved; senders emit zero and receivers ignore |

The configured fields describe persistent intent. The active fields describe current state and may
differ while DHCP is acquiring a lease or while a change is being applied. If bit 2 is clear, all
active fields are zero. The effective hostname satisfies the same syntax as a nonempty Configure
Network hostname. Opalinx does not prescribe a fallback address when DHCP fails.

Stored network configuration survives power cycles, firmware restarts, connection boundaries, and
ordinary Opalinx Reset. Restoring factory network defaults is a separate product or future-protocol
operation. Devices send network status only in response to a request; hosts poll when they need to
observe link or address changes.

Opalinx 1.0 defines one configurable primary IPv4 interface. Multiple interfaces, IPv6, DNS, service
discovery, connection establishment, and transport-specific network behaviour are outside these
messages and may use separate additive messages in a future specification.

### 11.4. SET_PIXELS_ACK (`0xC0`)

Sent in response to a successful [`Set Pixels`](#106-set-pixels-0x40) request with `TxID ≠ 0x0000`,
confirming that the pixel data has been buffered.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | CHECKSUM |
|----------------|------------|----------------|----------|
| 2 bytes        | `0xC0`     | `0x00` `0x00`  | 2 bytes  |

### 11.5. FILL_CHANNEL_ACK (`0xC1`)

Sent in response to a successful [`Fill Channel`](#107-fill-channel-0x41) request with `TxID ≠ 0x0000`,
confirming that the fill has been buffered.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | CHECKSUM |
|----------------|------------|----------------|----------|
| 2 bytes        | `0xC1`     | `0x00` `0x00`  | 2 bytes  |

### 11.6. SHOW_ACK (`0xD0`)

Sent in response to a successful [`Show`](#108-show-0x50) request with `TxID ≠ 0x0000`, after every
affected channel's transmission and required reset/latch interval have completed.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | CHECKSUM |
|----------------|------------|----------------|----------|
| 2 bytes        | `0xD0`     | `0x00` `0x00`  | 2 bytes  |

**Note:** Hosts should use response timeouts appropriate to the transport and device. A `SHOW_ACK`
is sent only after physical output completes, so its latency depends on the configured LED counts,
output profiles, and channel-output concurrency.

### 11.7. RESET_ACK (`0xD1`)

Sent in response to a successful [`Reset`](#1010-reset-0x51), after LED transmission has completed.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | CHECKSUM |
|----------------|------------|----------------|----------|
| 2 bytes        | `0xD1`     | `0x00` `0x00`  | 2 bytes  |

### 11.8. Namespaced Vendor Response (`0xFF`)

Sent after successful handling of a [`Namespaced Vendor Request`](#1011-namespaced-vendor-request-0x7f)
with a nonzero transaction ID. Its payload repeats the request's namespace length, namespace, and
command ID, followed by the command-specific response payload. The echoed transaction ID remains the
primary correlation key; repeating the namespace and command prevents decoding under the wrong
vendor contract.

### 11.9. ERROR (`0xE0`)

Sent by the device to report a protocol or operational error. Every retained request that passes
COBS decoding, minimum-size validation, and CRC validation, but is then rejected, MUST trigger
exactly one `ERROR` response when its transaction ID is nonzero. A device MUST NOT respond to a
request with transaction ID zero, and MUST silently discard oversized runs and uncorrelatable
framing or checksum failures. Thus a received candidate produces at most one response and device
output can never cause an error-response loop.

| TRANSACTION ID | IDENTIFIER | PAYLOAD LENGTH | PAYLOAD   | CHECKSUM |
|----------------|------------|----------------|-----------|----------|
| 2 bytes        | `0xE0`     | 2 bytes        | see below | 2 bytes  |

**Payload structure**:

| Field                | Size     | Description                                                    |
|----------------------|----------|----------------------------------------------------------------|
| Error code           | 1 byte   | See error codes below                                          |
| Offending identifier | 1 byte   | Id byte of message that caused error; `0x00` if unknown        |

**Error codes**:

| Value         | Name                         | Meaning                                           |
|---------------|------------------------------|---------------------------------------------------|
| `0x00`        | `ERR_UNSPECIFIED`            | Generic error                                     |
| `0x01`        | `ERR_UNKNOWN_IDENTIFIER`     | Identifier byte not recognized                    |
| `0x02`        | `ERR_INVALID_PAYLOAD_LENGTH` | Payload has no structurally valid length for the message |
| `0x03`        | `ERR_INVALID_PARAMETER`      | A field value or state-dependent combination is invalid |
| `0x04`        | `ERR_BUSY`                   | Device cannot accept the message at this time     |
| `0x05`        | `ERR_UNSUPPORTED`            | Message valid but unsupported by this device      |
| `0x06`        | `ERR_DEVICE_FAULT`           | Device failed to complete an otherwise-valid operation |
| `0x07`–`0xFF` | Reserved                     | Reserved for future specification versions        |

Devices SHOULD emit the most specific applicable error code. `ERR_UNSPECIFIED` is reserved for
conditions not covered by any other code and SHOULD NOT be used when a more specific code applies.
Hosts MUST accept and expose an unknown error code numerically; an unknown code does not make the
otherwise well-formed `ERROR` response malformed.

Vendor commands use standard `ERROR` codes for envelope, parameter, support, busy, and device-fault
conditions defined by the core protocol. Any additional command-specific status or error detail is
carried in the namespaced vendor response payload; vendors MUST NOT allocate private `ERROR` codes.

`ERR_BUSY` governs requests that exceed the one-Show backlog or require mutable pixel/configuration
state that is not currently available. The normative cases are defined by the
[pipeline admission table](#109-frame-pipelining).

Framing and checksum failures do not produce error responses because they provide no trustworthy
nonzero correlation key. Implementations MAY count or expose these failures through local diagnostics.

**Opalinx** 1.0 uses the transaction ID echoed in every response — including `ERROR` responses — to
correlate device replies with host requests.


## 12. Conformance

Canonical Opalinx wire examples and observable device-behavior cases are published in the
[conformance corpus](conformance/README.md).

The corpus supplements this specification but is not exhaustive. Passing every corpus case is
necessary but not sufficient for conformance; an implementation MUST satisfy all applicable
normative requirements in this specification.

For conformance, **recognize** means parsing the standard identifier, applying the specified
validation order, and returning a specific result or error rather than `ERR_UNKNOWN_IDENTIFIER`.
**Support** means successfully executing every otherwise-valid instance within the limits the device
advertises.

Every conformant device MUST recognize all standard 1.0 request identifiers. The required successful
baseline is:

| Request or mode | Conformance requirement |
|-----------------|-------------------------|
| Device information and configuration query | Mandatory |
| Network query and configuration | Mandatory when `CAP_NETWORK_CONFIG` is advertised; otherwise `ERR_UNSUPPORTED` |
| Broadcast Configure using `RGB8`, any valid component order, and output profile `0x00` | Mandatory |
| Set Pixels and Fill Channel for valid configured channels | Mandatory |
| Broadcast Show | Mandatory |
| Reset | Mandatory |
| Namespaced vendor request | Envelope validation mandatory; individual namespaces optional |
| Configuration and pixel data using every advertised pixel format and valid component order | Mandatory |
| Additional output profiles | Mandatory only for values advertised in INFO record `0x06` |

An advertised output-profile value is a behavioral promise, not merely descriptive metadata. A
device MUST support that profile for every otherwise-valid use.

A host implementation is conformant when it satisfies every applicable host requirement in this
specification, including the safe-acceptance requirements in
[Receiver Framing and Recovery](#65-receiver-framing-and-recovery).

A device is considered **Opalinx** 1.0 conformant if it:

- Recognizes all standard request messages and supports the mandatory baseline above.
- Uses the exact rejection precedence defined in
  [Receiver Framing and Recovery](#65-receiver-framing-and-recovery).
- Implements the session-boundary cleanup and persistent device state defined in
  [Connection and session boundaries](#72-connection-and-session-boundaries).
- Silently discards oversized, undecodable, short, and checksum-invalid candidates without affecting
  the state of prior valid messages; sends exactly one appropriate `ERROR` for other rejected requests
  with a nonzero transaction ID.
- Responds to `Request Device Information` with a properly formatted `INFO` response containing
  all required fields.
- Responds to `Request Device Configuration` with a properly formatted `CONFIG` response.
- Responds to the network messages with `NETWORK_CONFIG` when `CAP_NETWORK_CONFIG` is advertised,
  or with `ERR_UNSUPPORTED` when it is not.
- Responds to `Configure Device` with a `CONFIG` response on success or an appropriate `ERROR`
  response on failure; on success, clears the pixel buffer of every affected channel to all-zeros
  atomically (for broadcast, either all channels are updated or none).
- Accepts `Reset` during active Show transmission, allows the active Show to complete, cancels any
  pending Show, and transmits the reset all-zero output; an accepted Reset completes before any
  subsequent request is processed, and `RESET_ACK` is emitted only after every response still
  required for an earlier request has been emitted and the reset transmission has completed.
- Implements the one-Show backlog, admission, frame-protection, completion, and acknowledgement
  guarantees defined in [Frame Pipelining](#109-frame-pipelining).
- Sends `SET_PIXELS_ACK`, `FILL_CHANNEL_ACK`, and `SHOW_ACK` responses for pixel and show
  operations received with `TxID ≠ 0x0000`.
- Applies all field-specific reserved and unknown-value rules.
- Recognizes the namespaced vendor envelope and returns `ERR_UNSUPPORTED` for an unimplemented
  namespace or command.
- Rejects identifiers in reserved request ranges with `ERR_UNKNOWN_IDENTIFIER`.


## 13. Example Session

A typical client session driving 300 RGB LEDs per channel on an 8-channel device:

1. Client opens serial connection.
2. Client sends `Request Device Information` (`0x01`) with a nonzero transaction ID and waits for
   the corresponding `INFO` (`0x81`).
3. Client sends `Configure Device` (`0x20`) with a new nonzero transaction ID, channel `255`,
   `RGB8`, GRB component order (`0x7E81`), output profile `SINGLE_WIRE_PULSE_800K_T1`, and 300 LEDs per channel. It waits for the corresponding
   `CONFIG` (`0xA0`).
4. Client sends `Set Pixels` (`0x40`) with transaction ID zero for channel 0 and 900 bytes
   (300 × 3) of pixel data.
5. Client sends `Set Pixels` with transaction ID zero for channels 1 through 7 in the same manner.
6. Client sends `Show` (`0x50`) with a new nonzero transaction ID and channel `255` to commit all
   eight channels as one coordinated output operation. It waits for the corresponding `SHOW_ACK`
   (`0xD0`).
7. Client repeats steps 4–6 for each new frame, using a new nonzero Show transaction ID each time.

For installations where all channels display the same content (mirror mode), steps 4–5 collapse
into a single `Set Pixels` with channel `255`.

This example uses lock-step operation for clarity. A host may prepare and queue the next frame while
a Show is active by following [Frame Pipelining](#109-frame-pipelining).


## 14. Security Considerations

**Opalinx** 1.0 provides no authentication, authorization, or encryption. It assumes the underlying
transport is trusted.

Transport trust is a property of the deployment, not of the transport type. USB, UART, TCP, and
Bluetooth do not inherently prevent unauthorized software or users from sending **Opalinx**
commands. Where unauthorized access is possible, deployments MUST protect the transport externally,
using controls appropriate to the environment, such as physical access control, operating-system
device permissions, network isolation, or an authenticated and encrypted transport binding.

The CRC-16 checksum detects accidental bit errors in transit; it does not provide tamper
protection. An attacker with the ability to modify frames in transit can recompute a valid CRC
over altered data. **Opalinx** offers no mechanism to detect or prevent deliberate tampering.


## 15. Specification Governance

**Opalinx** is a centrally governed protocol. The author and maintainer of this repository is the sole
authority for publishing official versions of the **Opalinx** specification.

Proposed changes, clarifications, and extensions may be debated in
[GitHub Discussions](https://github.com/djipco/opalinx-spec/discussions), but only versions published
by the official **Opalinx** repository are considered authoritative.


## 16. Licence

The specification, conformance materials, software, and Opalinx marks are governed by the
[Opalinx Noncommercial Licence 1.0](LICENSE.md). Noncommercial use is free. Commercial products and
services using Opalinx require a separate written licence; contact Jean-Philippe Cô at <jp@djip.co>.
The same document defines permitted factual references to Opalinx and reserves official branding and
certification marks.


## 17. Contributing

Feedback and questions are welcome. Please use
[GitHub Discussions](https://github.com/djipco/opalinx-spec/discussions) to debate ideas, proposed
changes, clarifications, and extensions before submitting pull requests against the specification
text. Intentional submissions are subject to the contribution terms in
[section 4 of the licence](LICENSE.md#4-distribution-and-modifications).


## 18. Author

Opalinx was designed and authored by [Jean-Philippe Cô](https://djip.co), 2026.
