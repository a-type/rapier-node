const { execSync } = require('child_process');
const cpy = require('cpy');
const ts = require('typescript');
const rm = require('rimraf');
const write = require('write');
const fse = require('fs-extra');
const fs = require('fs');
const glob = require('glob');

const OUTPUT_2D = `${__dirname}/../rapier2d-node/dist`;
const OUTPUT_3D = `${__dirname}/../rapier3d-node/dist`;
const SRC = `${__dirname}/../src`;

function removeWrongDimensionDefinitions(text, is2d) {
  if (is2d) {
    return text.replace(/^ *\/\/ *#if +DIM3[\s\S]*?(?=#endif)#endif/gm, '');
  } else {
    return text.replace(/^ *\/\/ *#if +DIM2[\s\S]*?(?=#endif)#endif/gm, '');
  }
}

function transformFilesForDimension(dir, is2d) {
  const tsFiles = glob.sync(`${dir}/**/*.ts`);
  tsFiles.forEach((filePath) => {
    const contents = fs.readFileSync(filePath, { encoding: 'utf-8' });
    fs.writeFileSync(
      filePath,
      removeWrongDimensionDefinitions(contents, is2d),
      { encoding: 'utf-8' },
    );
  });
}

(async () => {
  console.info('Cleaning dist directories');
  await Promise.all([
    new Promise((resolve, reject) =>
      rm(OUTPUT_2D, (err) => {
        if (err) reject(err);
        else resolve();
      }),
    ),
    new Promise((resolve, reject) =>
      rm(OUTPUT_3D, (err) => {
        if (err) reject(err);
        else resolve();
      }),
    ),
  ]);

  console.info('Building WASM modules');
  /**
   * This will output JS and WASM files into the dist directory. These files represent
   * "raw" Rapier without bindings. We still need to use the bindings files in the rapier.js
   * project to provide a proper module API.
   */
  execSync(
    `wasm-pack build --target nodejs --out-dir ${OUTPUT_2D} ./rapier.js/rapier2d`,
  );
  execSync(
    `wasm-pack build --target nodejs --out-dir ${OUTPUT_3D} ./rapier.js/rapier3d`,
  );

  console.info('Copying TS bindings');
  /**
   * We copy the TS sources for the bindings out of the cloned rapier.js project repo,
   * but exclude raw.ts as this will be rewritten by us to point to the WASM output above.
   */
  await Promise.all([
    cpy([`./**`], OUTPUT_2D, {
      cwd: `${process.cwd()}/rapier.js/src.ts`,
      parents: true,
      overwrite: true,
      filter: (file) => file.name !== 'raw.ts',
    }),
    cpy([`./**`], OUTPUT_3D, {
      cwd: `${process.cwd()}/rapier.js/src.ts`,
      parents: true,
      overwrite: true,
      filter: (file) => file.name !== 'raw.ts',
    }),
  ]);

  console.info('Adding raw.ts shims');
  await Promise.all([
    fse.copy(`${SRC}/raw-2d.ts`, `${OUTPUT_2D}/raw.ts`),
    fse.copy(`${SRC}/globals.ts`, `${OUTPUT_2D}/globals.ts`),
    fse.copy(`${SRC}/raw-3d.ts`, `${OUTPUT_3D}/raw.ts`),
    fse.copy(`${SRC}/globals.ts`, `${OUTPUT_3D}/globals.ts`),
  ]);

  console.info('Removing #if defs for opposite dimension');
  transformFilesForDimension(OUTPUT_2D, true);
  transformFilesForDimension(OUTPUT_3D, false);

  console.info('Compiling TS bindings');
  try {
    execSync(`yarn tsc ./dist/rapier.ts`, {
      cwd: `${__dirname}/../rapier2d-node`,
    });
  } catch (err) {
    console.warn("tsc produced errors, but that's expected");
  }
  try {
    execSync(`yarn tsc ./dist/rapier.ts`, {
      cwd: `${__dirname}/../rapier3d-node`,
    });
  } catch (err) {
    console.warn("tsc produced errors, but that's expected");
  }
})();
