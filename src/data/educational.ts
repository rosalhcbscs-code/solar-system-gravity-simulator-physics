export interface EquationItem {
  id: string;
  title: string;
  formula: string;
  latexLike: string;
  purpose: string;
  variables: { symbol: string; name: string; unit: string; description: string }[];
  explanation: string;
  example: string;
}

export const PHYSICS_EQUATIONS: EquationItem[] = [
  {
    id: 'newton-gravity',
    title: "Newton's Law of Universal Gravitation",
    formula: 'F = G · (m₁ · m₂) / r²',
    latexLike: 'F = G \\frac{m_1 m_2}{r^2}',
    purpose: 'Quantifies the attractive gravitational force between any two masses across empty space.',
    variables: [
      { symbol: 'F', name: 'Gravitational Force', unit: 'Newtons (N)', description: 'Attractive force between the two bodies.' },
      { symbol: 'G', name: 'Gravitational Constant', unit: 'N·m²/kg²', description: '6.67430 × 10⁻¹¹ N·m²/kg² (fundamental physical constant).' },
      { symbol: 'm₁', name: 'Mass of Object 1', unit: 'Kilograms (kg)', description: 'Mass of the first celestial body (e.g. Sun).' },
      { symbol: 'm₂', name: 'Mass of Object 2', unit: 'Kilograms (kg)', description: 'Mass of the second celestial body (e.g. Earth).' },
      { symbol: 'r', name: 'Radial Distance', unit: 'Meters (m)', description: 'Straight-line center-to-center distance between objects.' },
    ],
    explanation:
      'Every particle in the universe attracts every other particle with a force directly proportional to the product of their masses and inversely proportional to the square of the distance between their centers. Double the distance, and the force drops to one-quarter.',
    example:
      'For the Sun (1.989 × 10³⁰ kg) and Earth (5.972 × 10²⁴ kg) separated by 1 AU (1.496 × 10¹¹ m), F ≈ 3.54 × 10²² N.',
  },
  {
    id: 'gravitational-acceleration',
    title: 'Gravitational Acceleration',
    formula: 'a = G · M / r²',
    latexLike: 'a = \\frac{GM}{r^2}',
    purpose: 'Calculates the acceleration an object feels in a gravitational field, independent of its own mass.',
    variables: [
      { symbol: 'a', name: 'Acceleration', unit: 'm/s²', description: 'Rate of change of velocity produced by gravity.' },
      { symbol: 'G', name: 'Gravitational Constant', unit: 'N·m²/kg²', description: '6.67430 × 10⁻¹¹ N·m²/kg².' },
      { symbol: 'M', name: 'Attractor Mass', unit: 'kg', description: 'Mass of the primary body exerting the gravity.' },
      { symbol: 'r', name: 'Distance', unit: 'm', description: 'Distance from the center of mass of the attractor.' },
    ],
    explanation:
      "Because F = m · a and F = G·M·m/r², dividing by the orbiting object's mass cancels it out! Galileo was right: all objects accelerate at the exact same rate in a given gravitational field regardless of how heavy they are.",
    example:
      'At 1 AU from the Sun, any object experiences a solar gravitational acceleration of a = 0.00593 m/s² (about 5.93 mm/s²).',
  },
  {
    id: 'circular-velocity',
    title: 'Stable Circular Orbital Velocity',
    formula: 'v = √(G · M / r)',
    latexLike: 'v = \\sqrt{\\frac{GM}{r}}',
    purpose: 'The exact tangential velocity required to maintain a stable circular orbit without falling in or escaping.',
    variables: [
      { symbol: 'v', name: 'Orbital Speed', unit: 'm/s (or km/s)', description: 'Tangential velocity vector magnitude.' },
      { symbol: 'G', name: 'Gravitational Constant', unit: 'N·m²/kg²', description: '6.67430 × 10⁻¹¹ N·m²/kg².' },
      { symbol: 'M', name: 'Central Mass', unit: 'kg', description: 'Mass of the central star or planet.' },
      { symbol: 'r', name: 'Orbital Radius', unit: 'm', description: 'Radius of the circular trajectory.' },
    ],
    explanation:
      'Planets do not crash into the Sun because their sideways forward speed makes them continuously fall "around" the Sun rather than straight into it. The curvature of their fall matches the curvature of the orbit.',
    example:
      'Earth orbits at ~29.78 km/s (~107,200 km/h). Mercury, being closer to the Sun, must travel at 47.36 km/s to balance the stronger gravity.',
  },
  {
    id: 'velocity-verlet',
    title: 'Numerical Symplectic Velocity Verlet Integration',
    formula: 'x(t + Δt) = x(t) + v(t)Δt + ½a(t)Δt²\nv(t + Δt) = v(t) + ½[a(t) + a(t + Δt)]Δt',
    latexLike: 'x_{n+1} = x_n + v_n \\Delta t + \\frac{1}{2} a_n \\Delta t^2',
    purpose: 'Simulates the trajectories of the N-body system forward in time while strictly conserving orbital energy and angular momentum.',
    variables: [
      { symbol: 'x', name: 'Position Vector', unit: 'm (or AU)', description: '3D coordinate of the body in space.' },
      { symbol: 'v', name: 'Velocity Vector', unit: 'm/s', description: 'Direction and speed of movement.' },
      { symbol: 'a', name: 'Acceleration Vector', unit: 'm/s²', description: 'Vector sum of forces divided by mass.' },
      { symbol: 'Δt', name: 'Simulation Time Step', unit: 'seconds', description: 'Time interval between successive numerical updates.' },
    ],
    explanation:
      'Unlike naive Euler integration (which spirals outward due to energy gain), Symplectic Verlet preserves orbital conservation laws over thousands of simulated orbits, keeping our simulated solar system stable and realistic.',
    example:
      'By substepping Δt into multiple micro-intervals per frame, numerical errors are minimized to within 0.001%.',
  },
];

export interface EducationalTopic {
  id: string;
  title: string;
  icon: string;
  summary: string;
  content: string[];
}

export const EDUCATIONAL_TOPICS: EducationalTopic[] = [
  {
    id: 'what-is-gravity',
    title: 'What is Gravity?',
    icon: '🌌',
    summary: 'The universal attractive force that binds atoms into planets, planets into solar systems, and stars into galaxies.',
    content: [
      'Gravity is one of the four fundamental interactions of physics (along with electromagnetism, the weak force, and the strong force).',
      'In classical Newtonian mechanics, every mass exerts a gravitational pull on every other mass in existence across all distances, though weakening with the square of distance (1/r²).',
      'In Einstein\'s General Relativity, gravity is interpreted as the curvature of 4-dimensional spacetime caused by mass and energy.',
      'Because mass is always positive in our universe, gravity is purely attractive—it never repels ordinary matter.',
    ],
  },
  {
    id: 'why-planets-orbit',
    title: 'Why Do Planets Orbit the Sun?',
    icon: '🪐',
    summary: 'Planets are in a perpetual state of freefall around the Sun.',
    content: [
      'Newton explained this with his famous "Cannonball Thought Experiment": imagine firing a cannon horizontally from a high mountain.',
      'At low speed, the cannonball hits the ground. At higher speed, it travels further. At orbital speed (~7.9 km/s on Earth, or ~29.8 km/s around the Sun), the curve of its falling path exactly matches the curvature of the body it is orbiting!',
      'Planets are constantly falling toward the Sun, but their high sideways (tangential) velocity means they miss it every instant, remaining in stable closed elliptical orbits.',
    ],
  },
  {
    id: 'jupiter-influence',
    title: 'Why Does Jupiter Have Such a Strong Gravitational Pull?',
    icon: '⚡',
    summary: 'Jupiter contains 71% of the planetary mass in our entire Solar System.',
    content: [
      'Jupiter is 318 times more massive than Earth and 2.5 times more massive than all the other planets in our Solar System combined.',
      'Because gravitational force is directly proportional to mass (F = G·m₁·m₂/r²), Jupiter exerts noticeable tugs on all neighbouring bodies.',
      'Jupiter\'s gravity prevents the formation of a planet in the asteroid belt by gravitationally stirring up planetesimals, and acts as a "cosmic vacuum cleaner" deflecting incoming comets away from inner terrestrial planets.',
    ],
  },
  {
    id: 'why-not-fall',
    title: 'Why Don\'t Planets Fall Directly Into the Sun?',
    icon: '☀️',
    summary: 'Angular momentum and conservation of energy keep orbits stable.',
    content: [
      'When the protoplanetary nebula collapsed 4.6 billion years ago, conservation of angular momentum caused it to spin faster and flatten into a disk.',
      'All planets formed with huge amounts of tangential kinetic energy. In the vacuum of space, there is virtually zero friction or atmospheric drag to slow them down.',
      'To fall into the Sun, a planet would have to lose almost all of its ~30 km/s sideways orbital velocity, which requires an astronomical amount of counter-force.',
    ],
  },
  {
    id: 'what-if-sun-disappears',
    title: 'What Happens If the Sun Disappears?',
    icon: '💥',
    summary: 'Without central gravity, planets fly off tangentially into interstellar space.',
    content: [
      'In Newtonian gravity, if the central mass drops to zero, the centripetal gravitational force vanishes immediately (in General Relativity, the gravitational wave travels at the speed of light, reaching Earth 8.3 minutes later).',
      'Newton\'s First Law of Motion states that an object in motion will stay in motion with a constant speed in a straight line unless acted on by a net external force.',
      'Therefore, all 8 planets immediately cease orbiting and shoot off along straight-line trajectories tangent to their positions at that instant, drifting forever as frozen rogue planets.',
    ],
  },
];
