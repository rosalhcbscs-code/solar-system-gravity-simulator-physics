import * as THREE from 'three';
import { TextureType } from '../types/simulation';

// Cache generated textures so we don't recreate them every frame
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Fast pseudo-random 2D gradient noise & Fractal Brownian Motion (fBm)
 * to generate photo-realistic procedural planetary surfaces.
 */
function createNoiseEngine() {
  const p = new Uint8Array(512);
  const permutation = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
    8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
    35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
    134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
    55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
    18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
    250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
    189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
    172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
    228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
    107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
  ];
  for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i] = permutation[i];
  }

  function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  function grad(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  function noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const A = p[X] + Y;
    const B = p[X + 1] + Y;
    return lerp(v,
      lerp(u, grad(p[A], xf, yf), grad(p[B], xf - 1, yf)),
      lerp(u, grad(p[A + 1], xf, yf - 1), grad(p[B + 1], xf - 1, yf - 1))
    );
  }

  function fbm(x: number, y: number, octaves = 4, persistence = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return (total / maxValue + 1) * 0.5; // Normalized 0..1
  }

  return { noise2D, fbm };
}

const noiseEngine = createNoiseEngine();

/**
 * Creates high-fidelity procedural planetary textures (1024x512)
 */
export function getProceduralPlanetTexture(type: TextureType): THREE.CanvasTexture {
  if (textureCache.has(type)) {
    return textureCache.get(type)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  const w = 1024;
  const h = 512;

  switch (type) {
    case 'sun': {
      // Photosphere with realistic plasma granulation, solar convection cells, flares, and sunspots
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        // Limb darkening factor
        const limb = Math.sin(ny * Math.PI);
        const limbFactor = Math.pow(Math.max(0.01, limb), 0.35);

        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const idx = (y * w + x) * 4;

          const n1 = noiseEngine.fbm(nx * 14, ny * 14, 5, 0.55);
          const n2 = noiseEngine.fbm(nx * 32, ny * 32, 3, 0.5);
          const granules = n1 * 0.7 + n2 * 0.3;

          // Sunspot clusters near equatorial bands (y between 180 and 330)
          let sunspot = 1.0;
          if (y > 180 && y < 330) {
            const spotNoise = noiseEngine.fbm(nx * 8 + 3.2, ny * 8 + 1.5, 4, 0.6);
            if (spotNoise > 0.72) {
              sunspot = Math.max(0.12, (1.0 - (spotNoise - 0.72) * 5.0));
            }
          }

          // Incandescent solar color ramp
          const brightness = (0.55 + granules * 0.45) * limbFactor * sunspot;
          let r = Math.min(255, Math.floor(255 * brightness * 1.2));
          let g = Math.min(255, Math.floor((140 + granules * 95) * brightness));
          let b = Math.min(255, Math.floor((15 + granules * 60) * brightness * 0.7));

          if (sunspot < 0.6) {
            // Dark umbra of sunspot
            r = Math.floor(r * 0.25);
            g = Math.floor(g * 0.15);
            b = Math.floor(b * 0.1);
          }

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case 'mercury': {
      // Desolate, highly cratered airless body with Caloris Basin, dark volcanic maria, and bright ray systems
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const idx = (y * w + x) * 4;

          const n1 = noiseEngine.fbm(nx * 6, ny * 6, 6, 0.52);
          const n2 = noiseEngine.fbm(nx * 20, ny * 20, 4, 0.48);
          const fine = noiseEngine.fbm(nx * 60, ny * 60, 2, 0.4);

          let base = n1 * 0.55 + n2 * 0.35 + fine * 0.1;

          // Caloris Basin impact structure at nx ~ 0.35, ny ~ 0.5
          const dx = (nx - 0.35) * 2.0;
          const dy = (ny - 0.5) * 1.0;
          const distCaloris = Math.sqrt(dx * dx + dy * dy);
          if (distCaloris < 0.25) {
            const ring = Math.sin(distCaloris * 45) * 0.12;
            base = base * 0.8 + ring;
          }

          // Subtle warm-greyish lunar regolith tone
          const val = Math.max(0, Math.min(255, Math.floor(base * 210 + 25)));
          data[idx] = Math.min(255, Math.floor(val * 1.02));     // slight warm tint
          data[idx + 1] = val;
          data[idx + 2] = Math.floor(val * 0.94); // depleted blue
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Add distinctive bright impact craters with radial rays
      ctx.fillStyle = 'rgba(235, 235, 240, 0.7)';
      const craters = [
        { x: 360, y: 240, r: 14, rays: 12 },
        { x: 720, y: 160, r: 10, rays: 9 },
        { x: 180, y: 380, r: 8, rays: 7 },
        { x: 880, y: 310, r: 12, rays: 10 },
      ];
      craters.forEach(({ x, y, r, rays }) => {
        // Rays
        ctx.strokeStyle = 'rgba(230, 230, 240, 0.25)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < rays; i++) {
          const ang = (i / rays) * Math.PI * 2 + Math.random() * 0.2;
          const len = r * (4 + Math.random() * 4);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
          ctx.stroke();
        }
        // Crater rim
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
      break;
    }

    case 'venus': {
      // Dense opaque sulfuric acid cloud deck with high-altitude chevron storm circulation
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        // Fast equatorial jet stream shear
        const shear = Math.sin(ny * Math.PI) * 1.8;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const idx = (y * w + x) * 4;

          // Planetary wave and chevron bands
          const waveX = nx * 5 + shear * Math.sin(nx * Math.PI * 2) * 0.2;
          const cloud1 = noiseEngine.fbm(waveX, ny * 8, 5, 0.55);
          const cloud2 = noiseEngine.fbm(nx * 16, ny * 18, 3, 0.4);
          const blend = cloud1 * 0.7 + cloud2 * 0.3;

          // Golden-yellow cream sulfuric acid coloration
          const r = Math.floor(215 + blend * 38);
          const g = Math.floor(180 + blend * 42);
          const b = Math.floor(125 + blend * 45);

          data[idx] = Math.min(255, r);
          data[idx + 1] = Math.min(255, g);
          data[idx + 2] = Math.min(255, b);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case 'earth': {
      // Photo-realistic Earth: accurate continental silhouettes, biomes, shallow shelf waters, deserts, ice caps
      for (let y = 0; y < h; y++) {
        const ny = y / h; // 0 (North Pole) to 1 (South Pole)
        const latDeg = (0.5 - ny) * 180;

        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const lonDeg = (nx - 0.5) * 360;
          const idx = (y * w + x) * 4;

          // Determine land vs ocean using geographic bounds + fractal coastline noise
          let isLand = false;
          let elevation = 0;
          let isDesert = false;

          const coastNoise = noiseEngine.fbm(nx * 10, ny * 10, 5, 0.52);

          // North America: lat 15 to 70, lon -165 to -50
          if (latDeg > 12 && latDeg < 72 && lonDeg > -165 && lonDeg < -50) {
            if (coastNoise > 0.44) isLand = true;
          }
          // South America: lat -55 to 12, lon -82 to -34
          if (latDeg > -55 && latDeg <= 12 && lonDeg > -82 && lonDeg < -34) {
            if (coastNoise > 0.42) isLand = true;
          }
          // Eurasia: lat 10 to 75, lon -10 to 175
          if (latDeg > 10 && latDeg < 76 && lonDeg > -12 && lonDeg < 172) {
            if (coastNoise > 0.43) isLand = true;
            // Sahara desert & Middle East
            if (latDeg > 15 && latDeg < 34 && lonDeg > -15 && lonDeg < 60) {
              isDesert = true;
            }
            // Gobi desert
            if (latDeg > 38 && latDeg < 48 && lonDeg > 85 && lonDeg < 115) {
              isDesert = true;
            }
          }
          // Africa: lat -35 to 37, lon -18 to 52
          if (latDeg > -35 && latDeg <= 37 && lonDeg > -18 && lonDeg < 52) {
            if (coastNoise > 0.43) isLand = true;
            if (latDeg > 12 && latDeg < 34) isDesert = true;
          }
          // Australia: lat -42 to -10, lon 112 to 154
          if (latDeg > -42 && latDeg < -10 && lonDeg > 112 && lonDeg < 154) {
            if (coastNoise > 0.42) isLand = true;
            if (lonDeg > 120 && lonDeg < 145) isDesert = true;
          }
          // Antarctica: lat < -65
          const isAntarctica = latDeg < -64;
          const isArctic = latDeg > 78 && coastNoise > 0.4;

          if (isLand || isAntarctica || isArctic) {
            if (isAntarctica || isArctic) {
              // Glacial Ice Cap
              const iceNoise = noiseEngine.fbm(nx * 18, ny * 18, 3, 0.5);
              data[idx] = Math.floor(235 + iceNoise * 20);
              data[idx + 1] = Math.floor(242 + iceNoise * 13);
              data[idx + 2] = 255;
            } else if (isDesert) {
              // Arid desert sands
              const dune = noiseEngine.fbm(nx * 24, ny * 24, 4, 0.45);
              data[idx] = Math.floor(215 + dune * 30);
              data[idx + 1] = Math.floor(180 + dune * 25);
              data[idx + 2] = Math.floor(120 + dune * 20);
            } else {
              // Lush green vegetation & mountain terrain
              const mountain = noiseEngine.fbm(nx * 28, ny * 28, 4, 0.5);
              if (mountain > 0.65) {
                // High mountain brown/grey
                data[idx] = Math.floor(120 + mountain * 40);
                data[idx + 1] = Math.floor(100 + mountain * 35);
                data[idx + 2] = Math.floor(75 + mountain * 30);
              } else {
                // Temperate forest & plains green
                data[idx] = Math.floor(34 + mountain * 45);
                data[idx + 1] = Math.floor(115 + mountain * 55);
                data[idx + 2] = Math.floor(45 + mountain * 30);
              }
            }
          } else {
            // Oceans: deep blue abyss with vibrant cyan continental shelves near coasts
            const oceanDepth = coastNoise;
            if (oceanDepth > 0.38) {
              // Coastal shallow water (turquoise/cyan)
              data[idx] = 16;
              data[idx + 1] = Math.floor(85 + (oceanDepth - 0.38) * 350);
              data[idx + 2] = Math.floor(140 + (oceanDepth - 0.38) * 450);
            } else {
              // Deep oceanic trench navy blue
              data[idx] = 8;
              data[idx + 1] = 28;
              data[idx + 2] = 78;
            }
          }
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case 'mars': {
      // Iron-oxide red regolith, Valles Marineris canyon, Olympus Mons caldera, and polar ice caps
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        const latDeg = (0.5 - ny) * 180;

        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const idx = (y * w + x) * 4;

          const n1 = noiseEngine.fbm(nx * 7, ny * 7, 5, 0.5);
          const n2 = noiseEngine.fbm(nx * 22, ny * 22, 4, 0.45);
          const fine = noiseEngine.fbm(nx * 50, ny * 50, 2, 0.4);

          let terrain = n1 * 0.6 + n2 * 0.3 + fine * 0.1;

          // Polar Ice Caps (Planum Boreale & Planum Australe)
          if (latDeg > 76 || latDeg < -78) {
            data[idx] = 245;
            data[idx + 1] = 240;
            data[idx + 2] = 238;
            data[idx + 3] = 255;
            continue;
          }

          // Olympus Mons massive volcano caldera shield (nx ~ 0.38, ny ~ 0.45)
          const dxO = (nx - 0.38) * 1.5;
          const dyO = (ny - 0.45);
          const distO = Math.sqrt(dxO * dxO + dyO * dyO);
          if (distO < 0.08) {
            terrain = terrain * 0.6 + 0.35; // darker volcanic shield
          }

          // Valles Marineris massive canyon (nx from 0.45 to 0.65, ny ~ 0.53)
          if (nx > 0.44 && nx < 0.64 && Math.abs(ny - 0.53) < 0.02) {
            terrain = terrain * 0.4; // deep dark canyon floor
          }

          // Dark Basalt regions (Syrtis Major)
          if (nx > 0.72 && nx < 0.85 && ny > 0.4 && ny < 0.62) {
            terrain *= 0.68;
          }

          // Rich Martian terracotta rust colors
          const r = Math.floor(175 + terrain * 70);
          const g = Math.floor(70 + terrain * 55);
          const b = Math.floor(30 + terrain * 35);

          data[idx] = Math.min(255, r);
          data[idx + 1] = Math.min(255, g);
          data[idx + 2] = Math.min(255, b);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case 'jupiter': {
      // Dynamic turbulent zonal jet streams, shear eddies, and the iconic Great Red Spot
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        // Latitudinal jet stream shear distortion
        const jetSpeed = Math.sin(ny * 24.0) * 0.08;

        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const idx = (y * w + x) * 4;

          const waveX = nx * 10 + jetSpeed * Math.sin(nx * 18);
          const bandNoise = noiseEngine.fbm(waveX, ny * 18, 5, 0.54);
          const eddyNoise = noiseEngine.fbm(nx * 32, ny * 32, 3, 0.45);

          // Great Red Spot located at nx ~ 0.62, ny ~ 0.68
          const dxG = (nx - 0.62) * 1.8;
          const dyG = (ny - 0.68) * 3.2;
          const distG = Math.sqrt(dxG * dxG + dyG * dyG);

          if (distG < 0.14) {
            // Swirling crimson anticyclone
            const spotAngle = Math.atan2(dyG, dxG);
            const swirl = Math.sin(spotAngle * 3.0 + distG * 35.0) * 0.15;
            const r = Math.floor(215 + swirl * 35);
            const g = Math.floor(55 + swirl * 25);
            const b = Math.floor(45 + swirl * 20);
            data[idx] = Math.min(255, r);
            data[idx + 1] = Math.min(255, g);
            data[idx + 2] = Math.min(255, b);
            data[idx + 3] = 255;
            continue;
          }

          // Latitudinal atmospheric color bands (Belts & Zones)
          const latBand = Math.sin(ny * 16.0);
          const t = (bandNoise * 0.7 + eddyNoise * 0.3 + latBand * 0.3 + 1) * 0.5;

          // Palette: ochre, caramel, cream, beige, deep rust
          const r = Math.floor(190 + t * 55);
          const g = Math.floor(140 + t * 50);
          const b = Math.floor(95 + t * 65);

          data[idx] = Math.min(255, r);
          data[idx + 1] = Math.min(255, g);
          data[idx + 2] = Math.min(255, b);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case 'saturn': {
      // Golden butterscotch and warm cream pastel latitudinal bands
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const idx = (y * w + x) * 4;

          const n1 = noiseEngine.fbm(nx * 8, ny * 22, 4, 0.5);
          const band = Math.sin(ny * 28.0) * 0.15;
          const val = n1 * 0.7 + band * 0.3;

          const r = Math.floor(228 + val * 24);
          const g = Math.floor(205 + val * 28);
          const b = Math.floor(145 + val * 35);

          data[idx] = Math.min(255, r);
          data[idx + 1] = Math.min(255, g);
          data[idx + 2] = Math.min(255, b);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case 'uranus': {
      // Featureless pale aquamarine/cyan ice giant atmosphere with methane haze
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const idx = (y * w + x) * 4;

          const n1 = noiseEngine.fbm(nx * 4, ny * 12, 3, 0.45);
          const band = Math.sin(ny * 8.0) * 0.08;

          const r = Math.floor(115 + (n1 + band) * 25);
          const g = Math.floor(205 + (n1 + band) * 28);
          const b = Math.floor(225 + (n1 + band) * 22);

          data[idx] = Math.min(255, r);
          data[idx + 1] = Math.min(255, g);
          data[idx + 2] = Math.min(255, b);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    case 'neptune': {
      // Intense cobalt azure blue with the Great Dark Spot and bright white cirrus methane storm streaks
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const idx = (y * w + x) * 4;

          const n1 = noiseEngine.fbm(nx * 6, ny * 14, 4, 0.5);
          const band = Math.sin(ny * 12.0) * 0.12;

          // Great Dark Spot at nx ~ 0.45, ny ~ 0.58
          const dxD = (nx - 0.45) * 2.0;
          const dyD = (ny - 0.58) * 2.5;
          const isDarkSpot = (dxD * dxD + dyD * dyD) < 0.05;

          let r = Math.floor(35 + (n1 + band) * 35);
          let g = Math.floor(85 + (n1 + band) * 45);
          let b = Math.floor(215 + (n1 + band) * 35);

          if (isDarkSpot) {
            r = Math.floor(r * 0.4);
            g = Math.floor(g * 0.5);
            b = Math.floor(b * 0.7);
          }

          // High altitude white cirrus cloud bands ("Scooter")
          if ((ny > 0.42 && ny < 0.45 && nx > 0.2 && nx < 0.55) ||
              (ny > 0.62 && ny < 0.64 && nx > 0.5 && nx < 0.85)) {
            const streak = noiseEngine.fbm(nx * 40, ny * 40, 2, 0.4);
            if (streak > 0.55) {
              r = 235;
              g = 245;
              b = 255;
            }
          }

          data[idx] = Math.min(255, r);
          data[idx + 1] = Math.min(255, g);
          data[idx + 2] = Math.min(255, b);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }

    default: {
      ctx.fillStyle = '#888888';
      ctx.fillRect(0, 0, w, h);
      break;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(type, texture);
  return texture;
}

/**
 * Creates Earth's dynamic rotating cloud texture (1024x512)
 * Includes realistic cyclone vortices, cold fronts, and equatorial ITCZ bands
 */
export function getEarthCloudsTexture(): THREE.CanvasTexture {
  if (textureCache.has('earth_clouds')) {
    return textureCache.get('earth_clouds')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(1024, 512);
  const data = imgData.data;

  const w = 1024;
  const h = 512;

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const idx = (y * w + x) * 4;

      const n1 = noiseEngine.fbm(nx * 8, ny * 8, 5, 0.55);
      const n2 = noiseEngine.fbm(nx * 24, ny * 24, 3, 0.48);
      const cloud = n1 * 0.7 + n2 * 0.3;

      // Tropical convergence cloud zone near equator
      const itcz = Math.exp(-Math.pow((ny - 0.5) * 8.0, 2)) * 0.25;
      const density = Math.max(0, cloud + itcz - 0.44);
      const alpha = Math.min(255, Math.floor(density * 520));

      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('earth_clouds', texture);
  return texture;
}

/**
 * Creates Saturn's high-definition multi-ring texture (1024x64)
 * Accurate Ring A, Cassini Division, Ring B (dense), Ring C (crepe ring), and Encke gap
 */
export function getSaturnRingTexture(): THREE.CanvasTexture {
  if (textureCache.has('saturn_ring')) {
    return textureCache.get('saturn_ring')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
  gradient.addColorStop(0.0, 'rgba(120, 100, 80, 0.0)');
  // Ring C (faint inner crepe ring)
  gradient.addColorStop(0.08, 'rgba(165, 145, 115, 0.25)');
  gradient.addColorStop(0.25, 'rgba(185, 165, 130, 0.45)');
  // Ring B (brightest and densest main ring)
  gradient.addColorStop(0.28, 'rgba(235, 220, 185, 0.95)');
  gradient.addColorStop(0.58, 'rgba(225, 210, 175, 0.90)');
  gradient.addColorStop(0.68, 'rgba(215, 195, 160, 0.85)');
  // Cassini Division (famous dark gap)
  gradient.addColorStop(0.69, 'rgba(35, 30, 25, 0.12)');
  gradient.addColorStop(0.74, 'rgba(15, 10, 8, 0.02)');
  // Ring A
  gradient.addColorStop(0.75, 'rgba(205, 188, 155, 0.75)');
  // Encke Gap
  gradient.addColorStop(0.88, 'rgba(40, 35, 30, 0.1)');
  gradient.addColorStop(0.90, 'rgba(195, 178, 145, 0.65)');
  gradient.addColorStop(0.98, 'rgba(160, 140, 110, 0.35)');
  gradient.addColorStop(1.0, 'rgba(100, 80, 60, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('saturn_ring', texture);
  return texture;
}

/**
 * Creates Uranus's delicate, faint concentric ring texture
 */
export function getUranusRingTexture(): THREE.CanvasTexture {
  if (textureCache.has('uranus_ring')) {
    return textureCache.get('uranus_ring')!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0.0, 'rgba(120, 200, 230, 0.0)');
  gradient.addColorStop(0.3, 'rgba(140, 210, 240, 0.15)');
  gradient.addColorStop(0.7, 'rgba(160, 225, 255, 0.35)');
  gradient.addColorStop(0.85, 'rgba(180, 235, 255, 0.45)');
  gradient.addColorStop(1.0, 'rgba(120, 200, 230, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set('uranus_ring', texture);
  return texture;
}
