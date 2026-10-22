import * as THREE from "three";

export interface TumbleweedModel {
  group: THREE.Group;
  update: (delta: number, windSpeed: number) => void;
  reset: (startX?: number) => void;
  dispose: () => void;
}

/**
 * Genera un modelo procedural 3D de un arbusto rodante del desierto (estepicursor / tumbleweed).
 * Construido con anillos y ramas entrelazadas de color pajizo seco con física de rodamiento y rebote.
 */
export function createTumbleweedModel(radius: number = 1.9): TumbleweedModel {
  const group = new THREE.Group();
  group.name = "tumbleweed_group";

  const disposables: Array<{ dispose: () => void }> = [];

  // Material de rama desértica seca
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b7a4a, // Madera seca pajiza
    roughness: 0.92,
    metalness: 0.05,
    wireframe: false,
  });
  disposables.push(branchMaterial);

  const innerTwigMaterial = new THREE.MeshStandardMaterial({
    color: 0x7a5e38, // Ramas interiores más oscuras
    roughness: 0.95,
    metalness: 0.02,
  });
  disposables.push(innerTwigMaterial);

  // 1. Núcleo de anillos entrelazados aleatorios
  const ringCount = 18;
  for (let i = 0; i < ringCount; i++) {
    const ringRadius = radius * (0.65 + Math.random() * 0.35);
    const tubeRadius = 0.06 + Math.random() * 0.04;
    const ringGeom = new THREE.TorusGeometry(ringRadius, tubeRadius, 6, 18);
    disposables.push(ringGeom);

    const mat = i % 3 === 0 ? innerTwigMaterial : branchMaterial;
    const ring = new THREE.Mesh(ringGeom, mat);
    ring.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    ring.castShadow = true;
    group.add(ring);
  }

  // 2. Ramitas curvas proyectadas hacia el exterior con espinas
  const twigCount = 32;
  const cylinderGeom = new THREE.CylinderGeometry(0.04, 0.08, radius * 0.9, 5);
  cylinderGeom.translate(0, radius * 0.45, 0);
  disposables.push(cylinderGeom);

  for (let i = 0; i < twigCount; i++) {
    const twig = new THREE.Mesh(cylinderGeom, branchMaterial);
    twig.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    twig.scale.set(
      0.7 + Math.random() * 0.5,
      0.7 + Math.random() * 0.6,
      0.7 + Math.random() * 0.5
    );
    group.add(twig);
  }

  // Sombra pequeña del arbusto
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext("2d");
  if (sCtx) {
    const grad = sCtx.createRadialGradient(64, 64, 4, 64, 64, 56);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.45)");
    grad.addColorStop(0.5, "rgba(0, 0, 0, 0.18)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  disposables.push(shadowTex);

  const shadowGeom = new THREE.PlaneGeometry(radius * 2.4, radius * 2.4);
  disposables.push(shadowGeom);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  disposables.push(shadowMat);

  const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, -radius + 0.05, 0);
  group.add(shadowMesh);

  // Estado de física
  let posX = 24;
  let groundY = -6.0 + radius;
  let bouncePhase = 0;

  const reset = (startX: number = 24) => {
    posX = startX;
    bouncePhase = 0;
    group.position.set(posX, groundY, 13.5);
    group.rotation.set(0, 0, 0);
  };

  reset();

  const update = (delta: number, windSpeed: number = 10.0) => {
    // Se desplaza de derecha a izquierda por el viento desértico
    posX -= delta * windSpeed;
    bouncePhase += delta * windSpeed * 1.6;

    // Rebote elástico contra el suelo
    const bounce = Math.abs(Math.sin(bouncePhase)) * 1.25;
    group.position.x = posX;
    group.position.y = groundY + bounce;

    // Rodamiento realista: rotación proporcional a la velocidad
    group.rotation.z += delta * windSpeed * 0.9;
    group.rotation.x += delta * windSpeed * 0.35;
    group.rotation.y += delta * windSpeed * 0.15;

    // Actualizar opacidad de la sombra según la altura del rebote
    const shadowFactor = Math.max(0.2, 1.0 - bounce * 0.4);
    shadowMesh.scale.set(shadowFactor, shadowFactor, shadowFactor);

    // Reiniciar ciclo si sale completamente del encuadre izquierdo
    if (posX < -24) {
      reset(24 + Math.random() * 6);
    }
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    group,
    update,
    reset,
    dispose,
  };
}
