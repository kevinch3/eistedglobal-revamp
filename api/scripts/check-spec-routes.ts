/**
 * Anti-drift gate: the set of routes the API actually serves must equal the set
 * documented in openapi.yaml. Catches "added an endpoint, forgot the spec" and
 * its opposite. Exits non-zero on any mismatch.
 *
 * Relies on app.ts exporting the app without listening (see server.ts).
 */
process.env.DB_PATH = ':memory:';
import fs from 'fs';
import path from 'path';
import app from '../src/app';

const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

function implementedRoutes(): Set<string> {
  const found = new Set<string>();
  const deRegex = (re: RegExp) => {
    const m = re.toString().match(/^\/\^\\?(.*?)\\\/\?\(\?=\\\/\|\$\)\/i?$/);
    return m ? m[1].replace(/\\\//g, '/') : '';
  };
  const walk = (stack: any[], prefix: string) => {
    for (const layer of stack) {
      if (layer.route) {
        const p = clean(prefix + layer.route.path);
        for (const m of Object.keys(layer.route.methods)) found.add(`${m.toUpperCase()} ${p}`);
      } else if (layer.name === 'router' && layer.handle?.stack) {
        walk(layer.handle.stack, prefix + deRegex(layer.regexp));
      }
    }
  };
  walk((app as any)._router.stack, '');
  return found;
}

function documentedRoutes(): Set<string> {
  const out = new Set<string>();
  const lines = fs.readFileSync(path.join(__dirname, '..', 'openapi.yaml'), 'utf8').split('\n');
  let inPaths = false, cur = '';
  for (const line of lines) {
    if (/^paths:/.test(line)) { inPaths = true; continue; }
    if (inPaths && /^[a-z]/.test(line)) break;
    if (!inPaths) continue;
    const p = line.match(/^  (\/\S*):$/);
    if (p) { cur = p[1]; continue; }
    const m = line.match(/^    (get|post|put|patch|delete):$/);
    if (m && cur) out.add(`${m[1].toUpperCase()} ${clean('/api' + cur)}`);
  }
  return out;
}

// Path-parameter names are an implementation detail; compare structure only.
const norm = (s: Set<string>) =>
  new Set([...s].map(x => x.replace(/:(\w+)/g, '{p}').replace(/\{(\w+)\}/g, '{p}')));

const impl = norm(implementedRoutes());
const spec = norm(documentedRoutes());
const undocumented = [...impl].filter(r => !spec.has(r)).sort();
const phantom = [...spec].filter(r => !impl.has(r)).sort();

console.log(`route inventory — implemented: ${impl.size}, documented: ${spec.size}`);
if (undocumented.length) {
  console.error('\n✘ served by the API but MISSING from openapi.yaml:');
  undocumented.forEach(r => console.error('    ' + r));
}
if (phantom.length) {
  console.error('\n✘ documented in openapi.yaml but NOT served:');
  phantom.forEach(r => console.error('    ' + r));
}
if (undocumented.length || phantom.length) process.exit(1);
console.log('✔ spec and implementation agree on every route');
