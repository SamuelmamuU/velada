import * as THREE from "three";
import { ICitaResponse } from "@/types";
import { EnvelopeModelParts } from "./types";

function renderEnvelopeCanvas(
  canvas: HTMLCanvasElement,
  cita: ICitaResponse | null,
  novioName: string,
  noviaName: string
) {
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Fondo de papel pergamino artesanal
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 640);
  bgGrad.addColorStop(0, "#fcf8ef");
  bgGrad.addColorStop(0.5, "#f7f0df");
  bgGrad.addColorStop(1, "#eedfc4");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 640);

  // 2. Textura sutil de vetas de papel
  ctx.fillStyle = "rgba(180, 150, 110, 0.05)";
  for (let i = 0; i < 300; i++) {
    const rx = Math.random() * 1024;
    const ry = Math.random() * 640;
    const rw = Math.random() * 20 + 5;
    ctx.fillRect(rx, ry, rw, 1);
  }

  // 3. Pliegues diagonales en bajorrelieve
  ctx.strokeStyle = "rgba(160, 130, 95, 0.22)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(512, 280);
  ctx.lineTo(1024, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 640);
  ctx.lineTo(512, 280);
  ctx.lineTo(1024, 640);
  ctx.stroke();

  // 4. Marco vintage doble con filigrana dorada
  ctx.strokeStyle = "#c59a3f";
  ctx.lineWidth = 4;
  ctx.strokeRect(34, 34, 956, 572);

  ctx.strokeStyle = "rgba(197, 154, 63, 0.45)";
  ctx.lineWidth = 1.8;
  ctx.strokeRect(44, 44, 936, 552);

  // 5. Título de la carta en el centro
  const rawTitle = cita?.nombre || "Nuestra Cita Especial";
  let displayTitle = rawTitle;
  if (displayTitle.length > 28) {
    displayTitle = displayTitle.slice(0, 26) + "...";
  }

  ctx.fillStyle = "#26160c";
  ctx.font = 'italic bold 42px "Georgia", "Times New Roman", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`“ ${displayTitle} ”`, 512, 360);

  // Línea decorativa bajo el título
  ctx.strokeStyle = "rgba(197, 154, 63, 0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(340, 410);
  ctx.lineTo(684, 410);
  ctx.stroke();

  ctx.fillStyle = "#c59a3f";
  ctx.beginPath();
  ctx.arc(512, 410, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Nombres de la pareja en letra pequeña superior
  ctx.font = '600 22px "Georgia", serif';
  ctx.fillStyle = "#7a5c3e";
  ctx.fillText(`Para: ${novioName} & ${noviaName}`, 512, 290);

  // 6. Fechas en esquinas inferiores
  const fechaEnvioRaw = cita?.createdAt ? new Date(cita.createdAt) : new Date();
  const fechaEnvioStr = fechaEnvioRaw.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const fechaCitaRaw = cita?.horario ? new Date(cita.horario) : new Date();
  const fechaCitaStr = fechaCitaRaw.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  ctx.font = 'bold 24px "Georgia", serif';
  ctx.fillStyle = "#4a3222";

  ctx.textAlign = "left";
  ctx.fillText(`📅 Envío: ${fechaEnvioStr}`, 60, 565);

  ctx.textAlign = "right";
  ctx.fillText(`✨ Cita: ${fechaCitaStr}`, 964, 565);
}

export function createEnvelopeModel(
  initialCita: ICitaResponse | null,
  novioName: string,
  noviaName: string
): EnvelopeModelParts {
  const group = new THREE.Group();
  group.name = "envelope_group";

  const width = 7.6;
  const height = 4.8;
  const depth = 0.28;

  const canvas = document.createElement("canvas");
  renderEnvelopeCanvas(canvas, initialCita, novioName, noviaName);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  const paperBaseColor = 0xf7f0df;
  const sideMat = new THREE.MeshStandardMaterial({
    color: paperBaseColor,
    roughness: 0.45,
    metalness: 0.02,
  });
  const frontMat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.38,
    metalness: 0.05,
  });
  const backMat = new THREE.MeshStandardMaterial({
    color: 0xeadfc6,
    roughness: 0.5,
    metalness: 0.02,
  });

  const materials = [
    sideMat, // right (+X)
    sideMat, // left (-X)
    sideMat, // top (+Y)
    sideMat, // bottom (-Y)
    frontMat, // front (+Z)
    backMat,  // back (-Z)
  ];

  const bodyGeom = new THREE.BoxGeometry(width, height, depth);
  const envelopeMesh = new THREE.Mesh(bodyGeom, materials);
  envelopeMesh.castShadow = true;
  envelopeMesh.receiveShadow = true;
  group.add(envelopeMesh);

  // Solapa triangular superior articulada
  // La bisagra está en la parte superior del sobre: y = height / 2, z = depth / 2
  const flapPivot = new THREE.Group();
  flapPivot.position.set(0, height * 0.5, depth * 0.5 + 0.01);
  group.add(flapPivot);

  const flapShape = new THREE.Shape();
  flapShape.moveTo(-width * 0.5, 0);
  flapShape.lineTo(0, -height * 0.52);
  flapShape.lineTo(width * 0.5, 0);
  flapShape.closePath();

  const flapGeom = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 12,
  });

  const flapMat = new THREE.MeshStandardMaterial({
    color: 0xf5ecd7,
    roughness: 0.42,
    metalness: 0.03,
  });
  const flapMesh = new THREE.Mesh(flapGeom, flapMat);
  flapMesh.castShadow = true;
  flapPivot.add(flapMesh);

  // Sello de cera 3D tridimensional colocado en la punta de la solapa
  const sealGroup = new THREE.Group();
  sealGroup.position.set(0, -height * 0.52 + 0.1, 0.08);

  const waxBaseGeom = new THREE.CylinderGeometry(0.75, 0.78, 0.14, 32);
  waxBaseGeom.rotateX(Math.PI / 2);
  const waxRimGeom = new THREE.TorusGeometry(0.72, 0.07, 12, 32);

  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xbe123c, // Carmesí intenso
    roughness: 0.28,
    metalness: 0.15,
  });
  const goldRingMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Oro clásico
    roughness: 0.22,
    metalness: 0.85,
  });

  const waxBase = new THREE.Mesh(waxBaseGeom, waxMat);
  const waxRim = new THREE.Mesh(waxRimGeom, goldRingMat);
  waxRim.position.set(0, 0, 0.05);

  // Corazón en relieve 3D sobre el sello
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, 0.1);
  heartShape.bezierCurveTo(0, 0.1, -0.25, 0.45, -0.25, 0.7);
  heartShape.bezierCurveTo(-0.25, 0.95, 0, 1.15, 0, 1.35);
  heartShape.bezierCurveTo(0, 1.15, 0.25, 0.95, 0.25, 0.7);
  heartShape.bezierCurveTo(0.25, 0.45, 0, 0.1, 0, 0.1);
  heartShape.closePath();

  const heartGeom = new THREE.ExtrudeGeometry(heartShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 16,
  });
  heartGeom.center();
  heartGeom.scale(0.38, 0.38, 0.38);

  const heartMesh = new THREE.Mesh(heartGeom, goldRingMat);
  heartMesh.position.set(0, 0, 0.1);

  sealGroup.add(waxBase);
  sealGroup.add(waxRim);
  sealGroup.add(heartMesh);
  flapPivot.add(sealGroup);

  const raycastTargets = [envelopeMesh, flapMesh, waxBase];

  const updateCita = (cita: ICitaResponse | null, novio: string, novia: string) => {
    renderEnvelopeCanvas(canvas, cita, novio, novia);
    texture.needsUpdate = true;
  };

  const dispose = () => {
    bodyGeom.dispose();
    flapGeom.dispose();
    waxBaseGeom.dispose();
    waxRimGeom.dispose();
    heartGeom.dispose();
    sideMat.dispose();
    frontMat.dispose();
    backMat.dispose();
    flapMat.dispose();
    waxMat.dispose();
    goldRingMat.dispose();
    texture.dispose();
  };

  return {
    group,
    flapPivot,
    envelopeMesh,
    raycastTargets,
    updateCita,
    dispose,
  };
}
