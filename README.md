## CORTEX PROXY
A simple websocket proxy that allows you to tap into the local mental command stream of an Emotiv Brain Machine Interface and broadcast it over a local network for multiple devices.

The proxy will automatically authorize and establish a mental command stream with the Emotiv BCI and then relay the data towards a port of your choice (default `:6969`).

You must already have a Brain machine interface conencted to the Emotiv BCI before starting this proxy.

```
// start the server
npm run dev

// access the mental command stream using ther `wscat` node JS websocket TUI
// over localhost
wscat ws://localhost:6969

// over a local network
wscat ws://192.168.0.69:6969
```
