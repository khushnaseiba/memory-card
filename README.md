# Memory Cards

A small two-player matching card game written in Rust and JS.

play it [here](https://khushnaseiba.github.io/memory-card/)

## Requirements

- Rust and Cargo
- The `wasm32-unknown-unknown` target
- `wasm-pack`
- Python 3 for the local static server

## Build and run

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
wasm-pack build --target web --out-dir web/pkg
python3 -m http.server 8080 -d web
```

Open http://localhost:8080 in a browser. Keep the server running while playing.
