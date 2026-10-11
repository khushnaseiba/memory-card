# Memory Cards

A small two-player matching game with the game state written in Rust and the browser UI written in JavaScript. Rust is compiled to WebAssembly with `wasm-pack`.

## Requirements

- Rust and Cargo
- The `wasm32-unknown-unknown` target
- `wasm-pack`
- Python 3 for the local static server

## Build and run

```sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
cargo test
npm run build:wasm
npm run serve
```

Open `http://localhost:8080` in a browser. Keep the server running while playing.

You can run `npm start` to build the WASM package and start the server in one command after installing the requirements.

## Rules

Players take turns revealing two cards. A match adds one point and lets the same player go again. A mismatch stays visible briefly, then both cards are hidden and the turn moves to the other player. The game ends when all eight pairs are found.
