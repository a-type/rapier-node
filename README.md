# rapier-node

A NodeJS compatibility package for https://rapier.rs JS bindings

Rapier doesn't ship a package currently that works in NodeJS out of the box. The goal of this repo is to publish packages for Rapier which you can just `require` and use on the latest version of Node.

## Installing the packages

For **3D**, `npm i -s @a-type/rapier3d-node`.

For **2D**, `npm i -s @a-type/rapier2d-node`.

Usage:

```js
const RAPIER = require('@a-type/rapier3d-node');

const world = new RAPIER.World({ x: 0, y: 9.81 });
```

No async import or `await RAPIER.init()` is required.

## Building the packages

1. Install Rust
2. `cargo install wasm-pack`
3. `yarn install`
4. `yarn build`

## What this project does

1. Builds with `wasm-pack --target nodejs` instead of `--target web` to produce Node-compatible WASM modules
2. Injects missing globals into Node's global scope (no extra libs, just using Node core stuff):
   a. `self`
   b. `atob`
   c. `performance.now`
3. Removes binding definitions for the opposite dimensionality (removes 3d APIs for the 2d library and vice versa)
4. Copies the TS bindings files from `rapier.js` alongside the WASM module output
5. Compiles the TS to create the fully bound library with the same interface as the web versions

## Testing

I copied a simple test scene from https://github.com/AutomatonSystems/rapier-node to `test/test.js`. You can run `yarn test` to execute the script; if you see positions logged and it completes successfully, the library has at least loaded and ran!

## Weirdness

The TS typings for the WASM module are apparently quite messed up. As such, the final step of compiling TS for the libraries produces tons of type errors.

For now I'm just ignoring them during the build. `tsc` doesn't have a good way to do transpile-only mode that I know of. Babel could do that, but this is just a shim project anyway so I'm not sure I care to 'fix' it.
