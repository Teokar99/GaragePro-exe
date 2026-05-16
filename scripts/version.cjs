const fs = require('fs');
const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: npm run version <version>  e.g. npm run version 0.2.0');
  process.exit(1);
}

// package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = version;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

// tauri.conf.json
const tauri = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));
tauri.package.version = version;
fs.writeFileSync('src-tauri/tauri.conf.json', JSON.stringify(tauri, null, 2) + '\n');

// Cargo.toml
let cargo = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
cargo = cargo.replace(/^version = ".*"$/m, `version = "${version}"`);
fs.writeFileSync('src-tauri/Cargo.toml', cargo);

console.log(`Version bumped to ${version} in package.json, tauri.conf.json, Cargo.toml`);
