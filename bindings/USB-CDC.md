# Opalinx USB CDC Binding
### Version: 1.0.0-alpha.1

> [!WARNING]
> **This is a prerelease binding and is not production-ready.** Breaking changes may occur before
> `1.0.0`.

## 1. Scope

This binding carries the Opalinx byte stream over a native USB Communications Device Class Abstract
Control Model (CDC ACM) function. Its binding name is `opalinx-usb-cdc` and its version is
`1.0.0-alpha.1`.

This document defines only the USB connection. Message framing, transactions, behavior, and
conformance remain defined by the [Opalinx Protocol Specification](../README.md).

USB-to-UART adapters are not covered because their UART parameters require a separate binding.

## 2. USB function

The device MUST expose one CDC ACM function dedicated to Opalinx. A composite USB device MAY expose
other unrelated functions. The Opalinx CDC control interface MUST use the USB interface string
`Opalinx`.

The host may select the interface manually or by inspecting USB descriptors. This binding does not
assign USB vendor or product identifiers, and a host MUST NOT identify an Opalinx interface from the
CDC class alone.

The host is the Opalinx host and USB host. The controller is the Opalinx device and USB device. INFO
transport record `0x05`, when present, contains `usb-cdc`.

## 3. Connection parameters

The CDC data interface carries the COBS-encoded Opalinx stream unchanged over its bulk endpoints.
USB transfers and host reads or writes do not create Opalinx frame boundaries.

The device MUST accept standard CDC line-coding requests, but baud rate, parity, stop bits, and data
bits do not alter native USB transport behavior. The host SHOULD request 8 data bits, no parity, and
one stop bit for compatibility with serial APIs. No baud rate has protocol meaning.

Hardware flow control and software flow control are not used. The device MUST ignore RTS. Bytes
`0x11` and `0x13` are ordinary Opalinx stream bytes and MUST NOT be interpreted as XON or XOFF.

## 4. Sessions

The host begins a session by opening the CDC interface and asserting Data Terminal Ready (DTR). If
DTR is already asserted, the host deasserts it before asserting it to begin a new session. The host
MUST NOT send Opalinx bytes while DTR is deasserted.

A session begins when the configured USB device observes DTR change from deasserted to asserted. It
ends when any of these events occurs:

- DTR is deasserted;
- the USB device is deconfigured or reset; or
- the USB connection is lost.

At each session boundary, both endpoints discard incomplete received frames and apply the cleanup
rules in Section 7.2 of the core specification. The device MUST NOT send Opalinx bytes while DTR is
deasserted. USB endpoint packetization and temporary lack of host reads do not by themselves end a
session.

After asserting DTR, the host sends Request Device Information before any state-changing or vendor
request, as required by the core specification. A host may discard locally buffered input before
asserting DTR; it MUST still validate every frame received in the new session.

## 5. Failures and limits

USB bulk transfer retries provide the reliable, ordered byte transport required by Opalinx while the
connection remains established. A USB reset, deconfiguration, disconnect, or unrecoverable endpoint
failure ends the session. The host reconnects and starts a new session rather than replaying requests
from the ended session.

The binding adds no payload or frame-size limit. The limits advertised and required by the core
specification apply. Endpoint buffers and USB transfers may divide or combine the byte stream at any
position.

## 6. Security

This binding provides no authentication, authorization, or encryption. Deployments prevent
unauthorized access through physical control, operating-system device permissions, or another
external control appropriate to the environment.

## 7. Conformance

An implementation claiming `opalinx-usb-cdc` conformance MUST:

- conform to the applicable host or device requirements of the core specification;
- implement the CDC function, interface identification, DTR session boundaries, and connection
  behavior defined here;
- carry the encoded Opalinx stream without transformation; and
- identify the binding name and version in its conformance documentation.

Core-protocol conformance alone does not imply conformance to this binding.
