// models.js – builds 3D molecule models (GLB) in the browser, so every file in the repo is text.
// Ball-and-stick: spheres for atoms, cylinders for bonds (double/triple bonds = parallel cylinders).

const ELEMENTS = {
  H:  { color: [0.95, 0.95, 0.95], r: 0.28, name: 'هيدروجين' },
  C:  { color: [0.25, 0.25, 0.25], r: 0.40, name: 'كربون' },
  N:  { color: [0.23, 0.44, 0.85], r: 0.40, name: 'نيتروجين' },
  O:  { color: [0.90, 0.22, 0.23], r: 0.38, name: 'أكسجين' },
  F:  { color: [0.56, 0.79, 0.23], r: 0.34, name: 'فلور' },
  S:  { color: [0.95, 0.76, 0.18], r: 0.48, name: 'كبريت' },
  Cl: { color: [0.23, 0.67, 0.21], r: 0.48, name: 'كلور' },
  P:  { color: [0.95, 0.55, 0.16], r: 0.48, name: 'فوسفور' },
  I:  { color: [0.48, 0.25, 0.63], r: 0.55, name: 'يود' },
};

const T = (a, b) => Math.sqrt(a * a + b * b);
const tet = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]].map(v => v.map(x => x / Math.sqrt(3)));

// atoms: [symbol, x, y, z] (Å, approximate); bonds: [i, j, order]
const MOLECULES = {
  N2O:  { title: 'أكسيد ثنائي النيتروجين', formula: 'N<sub>2</sub>O', note: 'الغاز الضاحك',
          atoms: [['N', -1.13, 0, 0], ['N', 0, 0, 0], ['O', 1.19, 0, 0]], bonds: [[0, 1, 3], [1, 2, 1]] },
  CO2:  { title: 'ثاني أكسيد الكربون', formula: 'CO<sub>2</sub>', note: '',
          atoms: [['O', -1.16, 0, 0], ['C', 0, 0, 0], ['O', 1.16, 0, 0]], bonds: [[0, 1, 2], [1, 2, 2]] },
  SO2:  { title: 'ثاني أكسيد الكبريت', formula: 'SO<sub>2</sub>', note: '',
          atoms: [['S', 0, 0.36, 0], ['O', -1.24, -0.36, 0], ['O', 1.24, -0.36, 0]], bonds: [[0, 1, 2], [0, 2, 2]] },
  NF3:  { title: 'ثالث فلوريد النيتروجين', formula: 'NF<sub>3</sub>', note: '',
          atoms: [['N', 0, 0.45, 0], ...[0, 120, 240].map(a => ['F', 1.25 * Math.cos(a * Math.PI / 180), -0.35, 1.25 * Math.sin(a * Math.PI / 180)])],
          bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  CCl4: { title: 'رابع كلوريد الكربون', formula: 'CCl<sub>4</sub>', note: '',
          atoms: [['C', 0, 0, 0], ...tet.map(v => ['Cl', 1.77 * v[0], 1.77 * v[1], 1.77 * v[2]])],
          bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]] },
  H2O:  { title: 'أكسيد ثنائي الهيدروجين', formula: 'H<sub>2</sub>O', note: 'الماء',
          atoms: [['O', 0, 0.12, 0], ['H', -0.76, -0.47, 0], ['H', 0.76, -0.47, 0]], bonds: [[0, 1, 1], [0, 2, 1]] },
  NH3:  { title: 'ثالث هيدريد النيتروجين', formula: 'NH<sub>3</sub>', note: 'الأمونيا',
          atoms: [['N', 0, 0.3, 0], ...[0, 120, 240].map(a => ['H', 0.94 * Math.cos(a * Math.PI / 180), -0.08, 0.94 * Math.sin(a * Math.PI / 180)])],
          bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  HCl:  { title: 'حمض الهيدروكلوريك', formula: 'HCl', note: 'حمض ثنائي',
          atoms: [['H', -0.64, 0, 0], ['Cl', 0.64, 0, 0]], bonds: [[0, 1, 1]] },
  HNO3: { title: 'حمض النيتريك', formula: 'HNO<sub>3</sub>', note: 'حمض أكسجيني',
          atoms: [['N', 0, 0, 0], ['O', -0.65, 1.05, 0], ['O', -0.65, -1.05, 0], ['O', 1.40, 0, 0], ['H', 1.75, 0.90, 0]],
          bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [3, 4, 1]] },
  H2SO4:{ title: 'حمض الكبريتيك', formula: 'H<sub>2</sub>SO<sub>4</sub>', note: 'حمض أكسجيني',
          atoms: [['S', 0, 0, 0], ...tet.map(v => ['O', 1.5 * v[0], 1.5 * v[1], 1.5 * v[2]]),
                  ['H', 1.5 * tet[0][0] + 0.55, 1.5 * tet[0][1] + 0.6, 1.5 * tet[0][2] - 0.2],
                  ['H', 1.5 * tet[1][0] - 0.55, 1.5 * tet[1][1] - 0.6, 1.5 * tet[1][2] - 0.2]],
          bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 2], [0, 4, 2], [1, 5, 1], [2, 6, 1]] },
};

// ---------- geometry ----------
function sphereGeom(seg = 24, ring = 16) {
  const pos = [], nor = [], idx = [];
  for (let y = 0; y <= ring; y++) {
    const v = y / ring, th = v * Math.PI;
    for (let x = 0; x <= seg; x++) {
      const u = x / seg, ph = u * 2 * Math.PI;
      const nx = Math.sin(th) * Math.cos(ph), ny = Math.cos(th), nz = Math.sin(th) * Math.sin(ph);
      pos.push(nx, ny, nz); nor.push(nx, ny, nz);
    }
  }
  for (let y = 0; y < ring; y++) for (let x = 0; x < seg; x++) {
    const a = y * (seg + 1) + x, b = a + seg + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  return { pos, nor, idx };
}
function cylGeom(seg = 18) { // unit cylinder along +Y from 0 to 1, radius 1
  const pos = [], nor = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = i / seg * 2 * Math.PI, x = Math.cos(a), z = Math.sin(a);
    pos.push(x, 0, z, x, 1, z); nor.push(x, 0, z, x, 0, z);
  }
  for (let i = 0; i < seg; i++) { const a = 2 * i; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  return { pos, nor, idx };
}
function quatFromYTo(d) { // rotate +Y onto unit vector d
  const [x, y, z] = d; const dot = y;
  if (dot > 0.99999) return [0, 0, 0, 1];
  if (dot < -0.99999) return [1, 0, 0, 0];
  const ax = [z, 0, -x]; // cross(Y,d) = (z*1 ... ) -> (1*z - 0, 0, 0 - x*1)
  const s = Math.sqrt((1 + dot) * 2), inv = 1 / s;
  return [ax[0] * inv, ax[1] * inv, ax[2] * inv, s * 0.5];
}

// ---------- GLB writer ----------
function buildGLB(mol) {
  const sph = sphereGeom(), cyl = cylGeom();
  const chunks = []; let byteLen = 0;
  const bufferViews = [], accessors = [];
  function addArray(arr, type, target, comp, count, kind, minmax) {
    const ta = comp === 5126 ? new Float32Array(arr) : new Uint16Array(arr);
    let bytes = new Uint8Array(ta.buffer);
    const pad = (4 - (bytes.length % 4)) % 4;
    bufferViews.push({ buffer: 0, byteOffset: byteLen, byteLength: bytes.length, target });
    chunks.push(bytes); if (pad) chunks.push(new Uint8Array(pad));
    byteLen += bytes.length + pad;
    const acc = { bufferView: bufferViews.length - 1, componentType: comp, count, type: kind };
    if (minmax) { acc.min = minmax[0]; acc.max = minmax[1]; }
    accessors.push(acc); return accessors.length - 1;
  }
  const sP = addArray(sph.pos, 0, 34962, 5126, sph.pos.length / 3, 'VEC3', [[-1, -1, -1], [1, 1, 1]]);
  const sN = addArray(sph.nor, 0, 34962, 5126, sph.nor.length / 3, 'VEC3');
  const sI = addArray(sph.idx, 0, 34963, 5123, sph.idx.length, 'SCALAR');
  const cP = addArray(cyl.pos, 0, 34962, 5126, cyl.pos.length / 3, 'VEC3', [[-1, 0, -1], [1, 1, 1]]);
  const cN = addArray(cyl.nor, 0, 34962, 5126, cyl.nor.length / 3, 'VEC3');
  const cI = addArray(cyl.idx, 0, 34963, 5123, cyl.idx.length, 'SCALAR');

  const materials = [], matIndex = {};
  function mat(key, color, rough = 0.45) {
    if (matIndex[key] === undefined) {
      materials.push({ name: key, pbrMetallicRoughness: { baseColorFactor: [...color, 1], metallicFactor: 0, roughnessFactor: rough } });
      matIndex[key] = materials.length - 1;
    }
    return matIndex[key];
  }
  const meshes = [], meshIndex = {};
  function mesh(kind, m) {
    const k = kind + m;
    if (meshIndex[k] === undefined) {
      const attrs = kind === 's' ? { POSITION: sP, NORMAL: sN } : { POSITION: cP, NORMAL: cN };
      meshes.push({ primitives: [{ attributes: attrs, indices: kind === 's' ? sI : cI, material: m }] });
      meshIndex[k] = meshes.length - 1;
    }
    return meshIndex[k];
  }
  // centre the molecule
  const c = [0, 0, 0]; mol.atoms.forEach(a => { c[0] += a[1]; c[1] += a[2]; c[2] += a[3]; });
  c.forEach((v, i) => c[i] = v / mol.atoms.length);
  const P = mol.atoms.map(a => [a[1] - c[0], a[2] - c[1], a[3] - c[2]]);
  const nodes = [];
  mol.atoms.forEach((a, i) => {
    const e = ELEMENTS[a[0]];
    nodes.push({ name: a[0], mesh: mesh('s', mat(a[0], e.color)), translation: P[i], scale: [e.r, e.r, e.r] });
  });
  const bondMat = mat('bond', [0.62, 0.62, 0.66], 0.5);
  mol.bonds.forEach(([i, j, order]) => {
    const a = P[i], b = P[j];
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const L = Math.hypot(...d); const u = d.map(x => x / L);
    // perpendicular for multiple bonds
    let p = [u[1], -u[0], 0]; if (Math.hypot(...p) < 0.1) p = [0, u[2], -u[1]];
    const pl = Math.hypot(...p); p = p.map(x => x / pl);
    const offs = order === 1 ? [0] : order === 2 ? [-0.09, 0.09] : [-0.13, 0, 0.13];
    const rad = order === 1 ? 0.085 : 0.055;
    offs.forEach(o => nodes.push({ mesh: mesh('c', bondMat), translation: [a[0] + p[0] * o, a[1] + p[1] * o, a[2] + p[2] * o],
      rotation: quatFromYTo(u), scale: [rad, L, rad] }));
  });
  const json = {
    asset: { version: '2.0', generator: 'naming-molecules models.js' },
    scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes, materials, accessors, bufferViews,
    buffers: [{ byteLength: byteLen }],
  };
  let jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jpad = (4 - (jsonBytes.length % 4)) % 4;
  const jb = new Uint8Array(jsonBytes.length + jpad); jb.set(jsonBytes); jb.fill(0x20, jsonBytes.length);
  const total = 12 + 8 + jb.length + 8 + byteLen;
  const out = new Uint8Array(total); const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, jb.length, true); dv.setUint32(16, 0x4E4F534A, true); out.set(jb, 20);
  let off = 20 + jb.length;
  dv.setUint32(off, byteLen, true); dv.setUint32(off + 4, 0x004E4942, true); off += 8;
  chunks.forEach(ch => { out.set(ch, off); off += ch.length; });
  return out;
}

function moleculeURL(key) {
  return URL.createObjectURL(new Blob([buildGLB(MOLECULES[key])], { type: 'model/gltf-binary' }));
}
if (typeof module !== 'undefined') module.exports = { MOLECULES, ELEMENTS, buildGLB };
