import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BodyState, CelestialBodyDefinition, SimulationConfig } from '../types/simulation';
import { getProceduralPlanetTexture, getSaturnRingTexture, getUranusRingTexture, getEarthCloudsTexture } from '../utils/textures';
import { getVisualRadius } from '../physics/constants';

interface SimulationCanvasProps {
  bodies: BodyState[];
  definitions: CelestialBodyDefinition[];
  selectedBodyId: string | null;
  onSelectBody: (id: string | null) => void;
  config: SimulationConfig;
  cameraFocusId: string | null;
  onCameraFocusChange: (id: string | null) => void;
}

// Reusable scratch vectors to avoid Garbage Collection inside render loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _curLookAt = new THREE.Vector3(0, 0, 0);

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  bodies,
  definitions,
  selectedBodyId,
  onSelectBody,
  config,
  cameraFocusId,
  onCameraFocusChange,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredBodyName, setHoveredBodyName] = useState<string | null>(null);

  // Keep references to latest props for use inside the animation loop
  const bodiesRef = useRef(bodies);
  bodiesRef.current = bodies;

  const configRef = useRef(config);
  configRef.current = config;

  const selectedIdRef = useRef(selectedBodyId);
  selectedIdRef.current = selectedBodyId;

  const focusIdRef = useRef(cameraFocusId);
  focusIdRef.current = cameraFocusId;

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020308);

    const camera = new THREE.PerspectiveCamera(
      45,
      mountEl.clientWidth / mountEl.clientHeight,
      0.5,
      3500
    );
    camera.position.set(0, 110, 160);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountEl.appendChild(renderer.domElement);

    // 2. Realistic Space Lighting
    // Radiant sun pointlight radiating outwards from center
    const sunLight = new THREE.PointLight(0xfffaed, 3.2, 900, 0.35);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Ambient space light so night sides aren't 100% black (starlight reflection)
    const ambientLight = new THREE.AmbientLight(0x1a2238, 0.45);
    scene.add(ambientLight);

    // Deep galaxy starlight fill
    const hemiLight = new THREE.HemisphereLight(0x28385a, 0x050711, 0.3);
    scene.add(hemiLight);

    // 3. Deep Space Starfield with Diverse Brightness & Distant Nebula Clusters
    const starCount = 4200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 1000 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const colorType = Math.random();
      if (colorType > 0.85) {
        // Hot O/B-type blue-white stars
        starColors[i * 3] = 0.7;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 1.0;
      } else if (colorType > 0.7) {
        // Red / Orange M/K-type giants
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.75;
        starColors[i * 3 + 2] = 0.55;
      } else if (colorType > 0.5) {
        // G-type yellow stars
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 0.8;
      } else {
        // Pure white stars
        starColors[i * 3] = 0.95;
        starColors[i * 3 + 1] = 0.95;
        starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 4. Create Celestial Body Meshes, Axial Tilts, Clouds & Atmosphere Shells
    const bodyMeshes: Map<
      string,
      {
        group: THREE.Group;
        planetPivot: THREE.Group;
        planetMesh: THREE.Mesh;
        cloudsMesh?: THREE.Mesh;
        atmosphereMesh?: THREE.Mesh;
        sunCoronaMesh?: THREE.Mesh;
        trailLine?: THREE.Line;
        vectorArrow?: THREE.ArrowHelper;
        rotationSpeed: number;
        cloudsRotationSpeed?: number;
      }
    > = new Map();

    const defMap = new Map<string, CelestialBodyDefinition>();
    definitions.forEach((d) => defMap.set(d.id, d));

    definitions.forEach((def) => {
      // Main positioning group (moves along orbit)
      const group = new THREE.Group();
      group.name = def.id;

      // Axial tilt pivot group (maintains realistic astronomical axial tilt)
      const planetPivot = new THREE.Group();
      const tiltRad = THREE.MathUtils.degToRad(def.axialTiltDeg ?? 0);
      planetPivot.rotation.z = tiltRad;
      group.add(planetPivot);

      const visualRadius = getVisualRadius(def.radiusKm, def.id === 'sun', configRef.current.scaleMode);
      const texture = getProceduralPlanetTexture(def.textureType);

      let planetMesh: THREE.Mesh;
      let cloudsMesh: THREE.Mesh | undefined;
      let atmosphereMesh: THREE.Mesh | undefined;
      let sunCoronaMesh: THREE.Mesh | undefined;

      // Calculate realistic relative rotation speed
      // 24 hours = 0.4 rad/sec baseline
      const rotPeriod = def.rotationPeriodHours ?? 24;
      const rotationSpeed = rotPeriod !== 0 ? (24 / rotPeriod) * 0.25 : 0.05;

      if (def.id === 'sun') {
        // High-fidelity Photosphere
        const sunGeo = new THREE.SphereGeometry(visualRadius, 48, 48);
        const sunMat = new THREE.MeshBasicMaterial({
          map: texture,
          color: 0xffffff,
        });
        planetMesh = new THREE.Mesh(sunGeo, sunMat);
        planetPivot.add(planetMesh);

        // Radiant Convective Corona Glow (Inner layer)
        const coronaGeo = new THREE.SphereGeometry(visualRadius * 1.25, 36, 36);
        const coronaMat = new THREE.MeshBasicMaterial({
          color: 0xffaa00,
          transparent: true,
          opacity: 0.38,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
        });
        sunCoronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
        group.add(sunCoronaMesh);

        // Outer Radiant Stellar Flare Halo (Outer layer)
        const outerHaloGeo = new THREE.SphereGeometry(visualRadius * 1.55, 32, 32);
        const outerHaloMat = new THREE.MeshBasicMaterial({
          color: 0xff6600,
          transparent: true,
          opacity: 0.16,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
        });
        const outerHalo = new THREE.Mesh(outerHaloGeo, outerHaloMat);
        group.add(outerHalo);
      } else {
        // Realistic Planets with PBR Shader Materials
        const planetGeo = new THREE.SphereGeometry(visualRadius, 48, 48);

        // Surface Material
        const isGasGiant = def.category === 'gas_giant' || def.category === 'ice_giant';
        const planetMat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: isGasGiant ? 0.9 : (def.id === 'earth' ? 0.45 : 0.85),
          metalness: 0.05,
          bumpScale: def.id === 'mercury' || def.id === 'mars' ? 0.04 : 0.015,
        });
        planetMesh = new THREE.Mesh(planetGeo, planetMat);
        planetMesh.castShadow = true;
        planetMesh.receiveShadow = true;
        planetPivot.add(planetMesh);

        // Earth Clouds Shell
        if (def.id === 'earth') {
          const cloudGeo = new THREE.SphereGeometry(visualRadius * 1.018, 48, 48);
          const cloudTexture = getEarthCloudsTexture();
          const cloudMat = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.85,
            blending: THREE.NormalBlending,
            roughness: 1.0,
            depthWrite: false,
          });
          cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
          planetPivot.add(cloudsMesh);
        }

        // Atmospheric Rayleigh Scattering Rim Glow
        if (def.hasAtmosphereGlow && def.atmosphereColor) {
          const atmoGeo = new THREE.SphereGeometry(visualRadius * 1.045, 36, 36);
          const atmoMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(def.atmosphereColor),
            transparent: true,
            opacity: def.id === 'earth' ? 0.28 : 0.18,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
          });
          atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
          planetPivot.add(atmosphereMesh);
        }

        // Saturn's Iconic Multi-Ring System
        if (def.id === 'saturn' && def.ringInner && def.ringOuter) {
          const ringGeo = new THREE.RingGeometry(
            visualRadius * def.ringInner,
            visualRadius * def.ringOuter,
            96
          );
          ringGeo.rotateX(-Math.PI / 2); // Ring lies in Saturn's equatorial plane

          const ringTexture = getSaturnRingTexture();
          const ringMat = new THREE.MeshStandardMaterial({
            map: ringTexture,
            side: THREE.DoubleSide,
            transparent: true,
            roughness: 0.65,
            metalness: 0.1,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          planetPivot.add(ringMesh);
        }

        // Uranus's Tilted Faint Ring System
        if (def.id === 'uranus' && def.ringInner && def.ringOuter) {
          const ringGeo = new THREE.RingGeometry(
            visualRadius * def.ringInner,
            visualRadius * def.ringOuter,
            64
          );
          ringGeo.rotateX(-Math.PI / 2);

          const ringTexture = getUranusRingTexture();
          const ringMat = new THREE.MeshBasicMaterial({
            map: ringTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          planetPivot.add(ringMesh);
        }
      }

      // Selection Highlight Reticle (orbits target)
      const selRingGeo = new THREE.RingGeometry(visualRadius * 1.55, visualRadius * 1.75, 48);
      selRingGeo.rotateX(-Math.PI / 2);
      const selRingMat = new THREE.MeshBasicMaterial({
        color: 0x00f5d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const selRing = new THREE.Mesh(selRingGeo, selRingMat);
      selRing.visible = false;
      selRing.name = 'selectionRing';
      group.add(selRing);

      // Trajectory History Line (LineBasicMaterial)
      const maxTrailPoints = 120;
      const trailPositions = new Float32Array(maxTrailPoints * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(def.color),
        transparent: true,
        opacity: 0.45,
      });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      scene.add(trailLine);

      // Dynamic Gravity Vector Arrow
      const vectorArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        5,
        0xff3366,
        1.8,
        1.0
      );
      vectorArrow.visible = false;
      scene.add(vectorArrow);

      scene.add(group);

      bodyMeshes.set(def.id, {
        group,
        planetPivot,
        planetMesh,
        cloudsMesh,
        atmosphereMesh,
        sunCoronaMesh,
        trailLine,
        vectorArrow,
        rotationSpeed,
        cloudsRotationSpeed: rotationSpeed * 1.12, // Clouds drift slightly faster
      });
    });

    // 5. Orbital Path Guides
    const orbitLinesGroup = new THREE.Group();
    scene.add(orbitLinesGroup);

    const updateOrbitLines = (scaleMode: 'visual' | 'realistic') => {
      while (orbitLinesGroup.children.length > 0) {
        const c = orbitLinesGroup.children[0];
        orbitLinesGroup.remove(c);
      }

      definitions.forEach((def) => {
        if (def.orbitalRadiusAu === 0) return;
        const pts: THREE.Vector3[] = [];
        const segments = 140;

        const rVisual = scaleMode === 'visual'
          ? 12 + Math.pow(def.orbitalRadiusAu, 0.6) * 19
          : def.orbitalRadiusAu * 14.0;

        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          pts.push(new THREE.Vector3(rVisual * Math.cos(theta), 0, rVisual * Math.sin(theta)));
        }

        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(def.color),
          transparent: true,
          opacity: 0.18,
        });
        const line = new THREE.Line(geo, mat);
        orbitLinesGroup.add(line);
      });
    };
    updateOrbitLines(configRef.current.scaleMode);

    // 6. Spacetime Curvature Grid (Gravitational Field Potential Wells)
    const gridSize = 280;
    const gridSegments = 40;
    const gridGeometry = new THREE.PlaneGeometry(gridSize, gridSize, gridSegments, gridSegments);
    gridGeometry.rotateX(-Math.PI / 2);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x3a5a9f,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const spacetimeGrid = new THREE.Mesh(gridGeometry, gridMaterial);
    spacetimeGrid.position.y = -2;
    scene.add(spacetimeGrid);

    // 7. Distance Line (Selected Planet -> Sun)
    const distLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const distLineMat = new THREE.LineDashedMaterial({
      color: 0x00f5d4,
      dashSize: 1.5,
      gapSize: 1.0,
      transparent: true,
      opacity: 0.7,
    });
    const distanceLine = new THREE.Line(distLineGeo, distLineMat);
    distanceLine.computeLineDistances();
    distanceLine.visible = false;
    scene.add(distanceLine);

    // 8. Mouse & Pointer Controls
    let isDragging = false;
    let dragButton = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let camDistance = 160;
    let camPolarAngle = Math.PI / 3.2;
    let camAzimuthAngle = Math.PI / 4;
    const camTarget = new THREE.Vector3(0, 0, 0);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragButton = e.button;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = mountEl.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        if (dragButton === 0) {
          camAzimuthAngle -= deltaX * 0.006;
          camPolarAngle = Math.max(0.08, Math.min(Math.PI / 2 - 0.04, camPolarAngle - deltaY * 0.006));
        } else if (dragButton === 2) {
          const panSpeed = camDistance * 0.0012;
          const forward = new THREE.Vector3(
            -Math.sin(camAzimuthAngle),
            0,
            -Math.cos(camAzimuthAngle)
          );
          const right = new THREE.Vector3(
            Math.cos(camAzimuthAngle),
            0,
            -Math.sin(camAzimuthAngle)
          );

          camTarget.addScaledVector(right, -deltaX * panSpeed);
          camTarget.addScaledVector(forward, deltaY * panSpeed);
        }
        return;
      }

      // Raycasting for hover tooltip
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const interactiveMeshes: THREE.Object3D[] = [];
      bodyMeshes.forEach((item) => {
        if (item.planetMesh.parent?.visible) {
          interactiveMeshes.push(item.planetMesh);
        }
      });

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        // Find ancestor group with planet name
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur && !defMap.has(cur.name) && cur.parent) {
          cur = cur.parent;
        }
        if (cur && defMap.has(cur.name)) {
          setHoveredBodyName(defMap.get(cur.name)?.name || cur.name);
          mountEl.style.cursor = 'pointer';
          return;
        }
      }

      setHoveredBodyName(null);
      mountEl.style.cursor = 'grab';
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      camDistance = Math.max(12, Math.min(650, camDistance * zoomFactor));
    };

    const onClick = (e: MouseEvent) => {
      const rect = mountEl.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

      const interactiveMeshes: THREE.Object3D[] = [];
      bodyMeshes.forEach((item) => {
        if (item.planetMesh.parent?.visible) {
          interactiveMeshes.push(item.planetMesh);
        }
      });

      const intersects = raycaster.intersectObjects(interactiveMeshes, false);
      if (intersects.length > 0) {
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur && !defMap.has(cur.name) && cur.parent) {
          cur = cur.parent;
        }
        if (cur && defMap.has(cur.name)) {
          onSelectBody(cur.name);
          onCameraFocusChange(cur.name);
          return;
        }
      }
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    mountEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mountEl.addEventListener('wheel', onWheel, { passive: false });
    mountEl.addEventListener('click', onClick);
    mountEl.addEventListener('contextmenu', onContextMenu);

    const onResize = () => {
      if (!mountEl) return;
      camera.aspect = mountEl.clientWidth / mountEl.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // 9. Main Animation Loop (60 FPS)
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();
      const currentConfig = configRef.current;
      const currentBodies = bodiesRef.current;
      const currentSelectedId = selectedIdRef.current;
      const currentFocusId = focusIdRef.current;

      const sunBody = currentBodies.find((b) => b.id === 'sun');
      const sunActive = sunBody?.active ?? true;

      currentBodies.forEach((b) => {
        const meshEntry = bodyMeshes.get(b.id);
        if (!meshEntry) return;

        const {
          group,
          planetMesh,
          cloudsMesh,
          sunCoronaMesh,
          trailLine,
          vectorArrow,
          rotationSpeed,
          cloudsRotationSpeed,
        } = meshEntry;

        group.visible = b.active;
        if (trailLine) trailLine.visible = b.active && currentConfig.showTrails;

        if (!b.active) {
          if (vectorArrow) vectorArrow.visible = false;
          return;
        }

        group.position.set(b.visualPosition.x, b.visualPosition.y, b.visualPosition.z);

        // Realistic axial rotation about the planet's tilted pole
        planetMesh.rotation.y += delta * rotationSpeed;

        // Earth dynamic clouds rotation
        if (cloudsMesh && cloudsRotationSpeed) {
          cloudsMesh.rotation.y += delta * cloudsRotationSpeed;
        }

        // Sun corona dynamic pulsing
        if (sunCoronaMesh) {
          const pulse = 1.0 + Math.sin(elapsedTime * 2.2) * 0.03;
          sunCoronaMesh.scale.set(pulse, pulse, pulse);
        }

        // Selection highlight ring visibility & rotation
        const selRing = group.getObjectByName('selectionRing') as THREE.Mesh;
        if (selRing) {
          const isSelected = b.id === currentSelectedId;
          selRing.visible = isSelected;
          if (isSelected) {
            selRing.rotation.z += delta * 0.8;
          }
        }

        // Update Trail Line
        if (trailLine && currentConfig.showTrails && b.trail.length > 1) {
          const positions = trailLine.geometry.attributes.position.array as Float32Array;
          const len = b.trail.length;
          for (let i = 0; i < len; i++) {
            positions[i * 3] = b.trail[i].x;
            positions[i * 3 + 1] = b.trail[i].y;
            positions[i * 3 + 2] = b.trail[i].z;
          }
          trailLine.geometry.setDrawRange(0, len);
          trailLine.geometry.attributes.position.needsUpdate = true;
        }

        // Update Dynamic Gravity Vector Arrow
        if (vectorArrow) {
          if (currentConfig.showVectors && b.id !== 'sun' && b.active && (b.netForceN > 0 || b.accMs2)) {
            vectorArrow.visible = true;
            vectorArrow.position.set(b.visualPosition.x, b.visualPosition.y, b.visualPosition.z);

            const fx = b.forceVectorN.x;
            const fy = b.forceVectorN.y;
            const fz = b.forceVectorN.z;
            const forceMag = b.netForceN;

            if (forceMag > 0) {
              _dir.set(fx, fy, fz).normalize();
              vectorArrow.setDirection(_dir);

              const logForce = Math.log10(Math.max(1, forceMag));
              const arrowLength = Math.max(3.0, Math.min(24.0, (logForce - 18) * 2.2));
              vectorArrow.setLength(arrowLength, arrowLength * 0.3, arrowLength * 0.16);

              if (forceMag > 1e22) {
                vectorArrow.setColor(new THREE.Color(0xff2a5f));
              } else if (forceMag > 1e21) {
                vectorArrow.setColor(new THREE.Color(0xa855f7));
              } else {
                vectorArrow.setColor(new THREE.Color(0x06b6d4));
              }
            } else {
              vectorArrow.visible = false;
            }
          } else {
            vectorArrow.visible = false;
          }
        }
      });

      // Update Distance Line
      if (currentConfig.showDistanceLines && currentSelectedId && currentSelectedId !== 'sun') {
        const selectedBody = currentBodies.find((b) => b.id === currentSelectedId);
        if (selectedBody && selectedBody.active && sunActive) {
          distanceLine.visible = true;
          const posArray = distanceLine.geometry.attributes.position.array as Float32Array;
          posArray[0] = 0;
          posArray[1] = 0;
          posArray[2] = 0;
          posArray[3] = selectedBody.visualPosition.x;
          posArray[4] = selectedBody.visualPosition.y;
          posArray[5] = selectedBody.visualPosition.z;
          distanceLine.geometry.attributes.position.needsUpdate = true;
          distanceLine.computeLineDistances();
        } else {
          distanceLine.visible = false;
        }
      } else {
        distanceLine.visible = false;
      }

      // Update Spacetime Curvature Grid
      spacetimeGrid.visible = currentConfig.showGravityField;
      if (currentConfig.showGravityField) {
        const gridPos = gridGeometry.attributes.position;
        const count = gridPos.count;

        for (let i = 0; i < count; i++) {
          const vx = gridPos.getX(i);
          const vz = gridPos.getZ(i);

          let depth = 0;
          for (const b of currentBodies) {
            if (!b.active) continue;
            const dx = b.visualPosition.x - vx;
            const dz = b.visualPosition.z - vz;
            const dist = Math.sqrt(dx * dx + dz * dz);

            const massFactor = b.id === 'sun' ? 22 : Math.max(1, Math.log10(b.currentMassKg) * 0.45);
            depth -= massFactor / (dist * 0.15 + 1.2);
          }

          gridPos.setY(i, Math.max(-18, depth));
        }
        gridGeometry.computeVertexNormals();
        gridPos.needsUpdate = true;
      }

      // Orbit lines visibility
      orbitLinesGroup.visible = currentConfig.showOrbits;

      // Camera Position Damping / Focus Tracking
      if (currentFocusId) {
        const targetBody = currentBodies.find((b) => b.id === currentFocusId);
        if (targetBody && targetBody.active) {
          _targetLookAt.set(
            targetBody.visualPosition.x,
            targetBody.visualPosition.y,
            targetBody.visualPosition.z
          );
        } else {
          _targetLookAt.set(0, 0, 0);
        }
      } else {
        _targetLookAt.copy(camTarget);
      }

      _curLookAt.lerp(_targetLookAt, 0.08);

      _targetCamPos.set(
        _curLookAt.x + camDistance * Math.sin(camPolarAngle) * Math.sin(camAzimuthAngle),
        _curLookAt.y + camDistance * Math.cos(camPolarAngle),
        _curLookAt.z + camDistance * Math.sin(camPolarAngle) * Math.cos(camAzimuthAngle)
      );

      camera.position.lerp(_targetCamPos, 0.1);
      camera.lookAt(_curLookAt);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      mountEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mountEl.removeEventListener('wheel', onWheel);
      mountEl.removeEventListener('click', onClick);
      mountEl.removeEventListener('contextmenu', onContextMenu);

      renderer.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Hovered Planet Indicator / Reticle */}
      {hoveredBodyName && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-10 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-wider backdrop-blur-md shadow-lg shadow-cyan-500/10">
          Target: <span className="text-white font-semibold">{hoveredBodyName}</span> (Click to inspect)
        </div>
      )}

      {/* Camera Guidance Overlay Tip */}
      <div className="absolute bottom-24 left-6 pointer-events-none z-10 hidden md:flex items-center space-x-2 text-[11px] text-slate-400/80 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 backdrop-blur-sm">
        <span>Left Drag: Orbit</span>
        <span className="text-slate-600">•</span>
        <span>Right Drag: Pan</span>
        <span className="text-slate-600">•</span>
        <span>Scroll: Zoom</span>
      </div>

      {/* Vector Legend */}
      {config.showVectors && (
        <div className="absolute top-20 right-6 pointer-events-none z-10 flex flex-col space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs backdrop-blur-md shadow-xl">
          <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-0.5">
            Gravity Vectors
          </div>
          <div className="flex items-center space-x-2 text-slate-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span>Strong Force (&gt; 10²² N)</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <span>Medium Force (10²¹ - 10²² N)</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span>Weak Force (&lt; 10²¹ N)</span>
          </div>
        </div>
      )}
    </div>
  );
};
