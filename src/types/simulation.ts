export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type ScaleMode = 'visual' | 'realistic';

export type TextureType = 
  | 'sun' 
  | 'mercury' 
  | 'venus' 
  | 'earth' 
  | 'mars' 
  | 'jupiter' 
  | 'saturn' 
  | 'uranus' 
  | 'neptune'
  | 'star';

export interface CelestialBodyDefinition {
  id: string;
  name: string;
  symbol: string;
  category: 'star' | 'terrestrial' | 'gas_giant' | 'ice_giant' | 'dwarf';
  color: string;
  glowColor: string;
  massKg: number;
  radiusKm: number;
  orbitalRadiusAu: number;
  orbitalPeriodDays: number;
  orbitalVelocityKmS: number;
  eccentricity: number;
  inclinationDeg: number;
  hasRings?: boolean;
  ringInner?: number;
  ringOuter?: number;
  ringColor?: string;
  textureType: TextureType;
  description: string;
  gravityEquatorMs2: number;
  atmosphereComposition: string;
  funFact: string;
  axialTiltDeg?: number;
  rotationPeriodHours?: number;
  hasAtmosphereGlow?: boolean;
  atmosphereColor?: string;
  hasClouds?: boolean;
}

export interface BodyState {
  id: string;
  // Visual positions (in visual 3D scene units)
  visualPosition: Vector3D;
  // Astronomical physics position in Astronomical Units (AU)
  posAu: Vector3D;
  // Velocity in km/s
  velKmS: Vector3D;
  // Acceleration in m/s²
  accMs2: Vector3D;
  // Net gravitational force in Newtons
  netForceN: number;
  // Vector of net force
  forceVectorN: Vector3D;
  // Distance from Sun in AU
  distanceFromSunAu: number;
  // Distance from Sun in km
  distanceFromSunKm: number;
  // Speed in km/s
  speedKmS: number;
  // Current dynamic mass (can be scaled in experiment mode)
  currentMassKg: number;
  // Active in simulation
  active: boolean;
  // Orbit trail history (array of points in visual coordinates)
  trail: Vector3D[];
}

export interface PairwiseForceDetail {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  forceN: number;
  distanceAu: number;
  distanceKm: number;
  accOnTargetMs2: number;
  vector: Vector3D; // Normalized direction from target to attractor
}

export interface SimulationConfig {
  speedMultiplier: number;
  scaleMode: ScaleMode;
  showLabels: boolean;
  showOrbits: boolean;
  showVectors: boolean;
  showTrails: boolean;
  showDistanceLines: boolean;
  showGravityField: boolean;
  isPaused: boolean;
  sunMassMultiplier: number;
  jupiterMassMultiplier: number;
  vectorScale: number;
  trailLength: number;
}

export interface GravityChangeAlert {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  affectedBody: string;
  beforeForceN: number;
  afterForceN: number;
  percentChange: number;
  details: string[];
}
