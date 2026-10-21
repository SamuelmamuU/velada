import * as THREE from "three";
import { ModeloBuzon } from "@/types";
import { MailboxModelParts } from "./types";

interface MailboxOptions {
  modelo: ModeloBuzon;
  coupleNames: string;
}

export function createMailboxModel({ modelo, coupleNames }: MailboxOptions): MailboxModelParts {
  const group = new THREE.Group();
  group.name = `mailbox_${modelo}`;

  const raycastTargets: THREE.Object3D[] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  // ===========================================================================
  // PALETAS DE MATERIALES POR TEMA
  // ===========================================================================
  let bodyMaterial: THREE.MeshStandardMaterial;
  let backMaterial: THREE.MeshStandardMaterial;
  let doorMaterial: THREE.MeshStandardMaterial;
  let trimMaterial: THREE.MeshStandardMaterial;
  let flagArmMaterial: THREE.MeshStandardMaterial;
  let flagBladeMaterial: THREE.MeshStandardMaterial;
  let postMaterial: THREE.MeshStandardMaterial;

  if (modelo === "vintage") {
    bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.55,
      metalness: 0.78,
    });
    backMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a1f,
      roughness: 0.65,
      metalness: 0.8,
    });
    doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x282c33,
      roughness: 0.5,
      metalness: 0.75,
    });
    trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Latón envejecido
      roughness: 0.3,
      metalness: 0.88,
    });
    flagArmMaterial = new THREE.MeshStandardMaterial({
      color: 0x151515,
      roughness: 0.7,
      metalness: 0.9,
    });
    flagBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      roughness: 0.35,
      metalness: 0.8,
    });
    postMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1c22,
      roughness: 0.65,
      metalness: 0.5,
    });
  } else if (modelo === "moderno") {
    bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5ccd1, // Rosa pastel satinado
      roughness: 0.22,
      metalness: 0.15,
    });
    backMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8b8be,
      roughness: 0.25,
      metalness: 0.15,
    });
    doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.1,
    });
    trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4a261, // Oro rosa / cobrizo satinado
      roughness: 0.25,
      metalness: 0.75,
    });
    flagArmMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8fa3,
      roughness: 0.3,
      metalness: 0.4,
    });
    flagBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3366,
      roughness: 0.2,
      metalness: 0.2,
    });
    postMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8f9fa,
      roughness: 0.25,
      metalness: 0.3,
    });
  } else {
    // Clásico Imperial
    bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d6a99, // Azul postal clásico
      roughness: 0.28,
      metalness: 0.35,
    });
    backMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5278,
      roughness: 0.35,
      metalness: 0.35,
    });
    doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4879ad,
      roughness: 0.26,
      metalness: 0.35,
    });
    trimMaterial = new THREE.MeshStandardMaterial({
      color: 0xecb249, // Latón pulido
      roughness: 0.2,
      metalness: 0.92,
    });
    flagArmMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.4,
      metalness: 0.8,
    });
    flagBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0xd90429, // Rojo buzón brillante
      roughness: 0.24,
      metalness: 0.15,
    });
    postMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3525, // Madera tratada
      roughness: 0.85,
      metalness: 0.05,
    });
  }

  [
    bodyMaterial,
    backMaterial,
    doorMaterial,
    trimMaterial,
    flagArmMaterial,
    flagBladeMaterial,
    postMaterial,
  ].forEach((m) => disposables.push(m));

  // ===========================================================================
  // DIMENSIONES BASE Y GEOMETRÍA DEL CUERPO
  // ===========================================================================
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  let doorPivot: THREE.Group;
  let flagPivot: THREE.Group | null = null;
  let latchPivot: THREE.Group | null = null;
  let keyPivot: THREE.Group | null = null;

  // Parámetros compartidos
  const lengthZ = 22.0;
  const halfZ = lengthZ * 0.5;

  if (modelo === "vintage") {
    // -------------------------------------------------------------------------
    // MODELO 1: COFRE VICTORIANO / BAÚL FORJADO CON REMACHES
    // -------------------------------------------------------------------------
    const w = 15.0;
    const h = 11.5;
    const halfW = w * 0.5;

    // Cuerpo en baúl rectangular con cantos biselados
    const chestShape = new THREE.Shape();
    chestShape.moveTo(-halfW, 0);
    chestShape.lineTo(halfW, 0);
    chestShape.lineTo(halfW, h * 0.7);
    chestShape.quadraticCurveTo(halfW, h, halfW - 1.5, h);
    chestShape.lineTo(-halfW + 1.5, h);
    chestShape.quadraticCurveTo(-halfW, h, -halfW, h * 0.7);
    chestShape.closePath();

    const chestHole = new THREE.Path();
    const t = 0.7;
    chestHole.moveTo(-halfW + t, t);
    chestHole.lineTo(halfW - t, t);
    chestHole.lineTo(halfW - t, h * 0.7);
    chestHole.quadraticCurveTo(halfW - t, h - t, halfW - 1.5, h - t);
    chestHole.lineTo(-halfW + 1.5, h - t);
    chestHole.quadraticCurveTo(-halfW + t, h - t, -halfW + t, h * 0.7);
    chestHole.closePath();
    chestShape.holes.push(chestHole);

    const chestGeom = new THREE.ExtrudeGeometry(chestShape, {
      depth: lengthZ,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelSegments: 2,
    });
    disposables.push(chestGeom);
    chestGeom.translate(0, 0, -halfZ);

    const chestMesh = new THREE.Mesh(chestGeom, bodyMaterial);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    bodyGroup.add(chestMesh);

    // Tapa posterior
    const backGeom = new THREE.ExtrudeGeometry(chestShape, {
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
    });
    disposables.push(backGeom);
    backGeom.translate(0, 0, -halfZ - 0.7);
    const backMesh = new THREE.Mesh(backGeom, backMaterial);
    backMesh.castShadow = true;
    bodyGroup.add(backMesh);

    // Marco frontal reforzado con remaches
    const frameGeom = new THREE.BoxGeometry(w + 0.6, h + 0.6, 0.8);
    disposables.push(frameGeom);
    const frameMesh = new THREE.Mesh(frameGeom, trimMaterial);
    frameMesh.position.set(0, h * 0.5, halfZ);
    // Agujero interior del marco
    // Puerta abatible frontal con placas de forja
    doorPivot = new THREE.Group();
    doorPivot.position.set(0, 0.4, halfZ);
    group.add(doorPivot);

    const doorGeom = new THREE.BoxGeometry(w - 1.4, h - 0.8, 0.7);
    disposables.push(doorGeom);
    doorGeom.translate(0, (h - 0.8) * 0.5, 0);
    const doorMesh = new THREE.Mesh(doorGeom, doorMaterial);
    doorMesh.castShadow = true;
    doorPivot.add(doorMesh);
    raycastTargets.push(doorMesh);

    // Cerradura vintage con llave dorada
    latchPivot = new THREE.Group();
    latchPivot.position.set(0, h - 1.8, 0.5);
    doorPivot.add(latchPivot);

    const escutcheonGeom = new THREE.CylinderGeometry(0.85, 0.85, 0.15, 16);
    escutcheonGeom.rotateX(Math.PI / 2);
    disposables.push(escutcheonGeom);
    const escutcheon = new THREE.Mesh(escutcheonGeom, trimMaterial);
    latchPivot.add(escutcheon);

    keyPivot = new THREE.Group();
    keyPivot.position.set(0, 0, 0.2);
    const keyStemGeom = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 12);
    keyStemGeom.rotateX(Math.PI / 2);
    disposables.push(keyStemGeom);
    const keyStem = new THREE.Mesh(keyStemGeom, trimMaterial);
    keyPivot.add(keyStem);

    const keyRingGeom = new THREE.TorusGeometry(0.45, 0.1, 12, 16);
    disposables.push(keyRingGeom);
    const keyRing = new THREE.Mesh(keyRingGeom, trimMaterial);
    keyRing.position.set(0, 0, 0.7);
    keyPivot.add(keyRing);
    latchPivot.add(keyPivot);

    // Banderín lateral en -X
    flagPivot = new THREE.Group();
    flagPivot.position.set(-halfW - 0.15, h * 0.6, 2);
    group.add(flagPivot);

    const flagArmGeom = new THREE.CylinderGeometry(0.14, 0.14, 5.5, 10);
    flagArmGeom.translate(0, 2.75, 0);
    disposables.push(flagArmGeom);
    const flagArm = new THREE.Mesh(flagArmGeom, flagArmMaterial);
    flagPivot.add(flagArm);

    const flagBladeGeom = new THREE.BoxGeometry(0.12, 2.8, 2.2);
    flagBladeGeom.translate(0, 4.2, 1.1);
    disposables.push(flagBladeGeom);
    const flagBlade = new THREE.Mesh(flagBladeGeom, flagBladeMaterial);
    flagPivot.add(flagBlade);

  } else if (modelo === "moderno") {
    // -------------------------------------------------------------------------
    // MODELO 2: CÁPSULA NEO-FUTURISTA MINIMALISTA CON DETALLES REDONDEADOS
    // -------------------------------------------------------------------------
    const r = 7.0;
    const bodyHeight = 7.2;

    const capsuleShape = new THREE.Shape();
    capsuleShape.moveTo(-r, 0);
    capsuleShape.lineTo(r, 0);
    capsuleShape.lineTo(r, bodyHeight);
    capsuleShape.absarc(0, bodyHeight, r, 0, Math.PI, false);
    capsuleShape.lineTo(-r, 0);

    const capsuleHole = new THREE.Path();
    const t = 0.65;
    const ir = r - t;
    const ih = bodyHeight;
    capsuleHole.moveTo(-ir, t);
    capsuleHole.lineTo(ir, t);
    capsuleHole.lineTo(ir, ih);
    capsuleHole.absarc(0, ih, ir, 0, Math.PI, false);
    capsuleHole.lineTo(-ir, t);
    capsuleShape.holes.push(capsuleHole);

    const capsuleGeom = new THREE.ExtrudeGeometry(capsuleShape, {
      depth: lengthZ,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.2,
      bevelSegments: 3,
      curveSegments: 32,
    });
    disposables.push(capsuleGeom);
    capsuleGeom.translate(0, 0, -halfZ);

    const capsuleMesh = new THREE.Mesh(capsuleGeom, bodyMaterial);
    capsuleMesh.castShadow = true;
    capsuleMesh.receiveShadow = true;
    bodyGroup.add(capsuleMesh);

    // Ranura superior para correspondencia
    const slotGeom = new THREE.BoxGeometry(9.5, 0.45, 1.4);
    disposables.push(slotGeom);
    const slotMesh = new THREE.Mesh(slotGeom, trimMaterial);
    slotMesh.position.set(0, bodyHeight + r + 0.15, 0);
    bodyGroup.add(slotMesh);

    // Tapa posterior
    const backGeom = new THREE.ExtrudeGeometry(capsuleShape, {
      depth: 0.7,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
    });
    disposables.push(backGeom);
    backGeom.translate(0, 0, -halfZ - 0.6);
    const backMesh = new THREE.Mesh(backGeom, backMaterial);
    bodyGroup.add(backMesh);

    // Puerta frontal magnética
    doorPivot = new THREE.Group();
    doorPivot.position.set(0, 0.35, halfZ);
    group.add(doorPivot);

    const doorShape = new THREE.Shape();
    const dr = r - 0.2;
    const dh = bodyHeight - 0.2;
    doorShape.moveTo(-dr, 0);
    doorShape.lineTo(dr, 0);
    doorShape.lineTo(dr, dh);
    doorShape.absarc(0, dh, dr, 0, Math.PI, false);
    doorShape.lineTo(-dr, 0);

    const doorGeom = new THREE.ExtrudeGeometry(doorShape, {
      depth: 0.55,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      curveSegments: 32,
    });
    disposables.push(doorGeom);
    const doorMesh = new THREE.Mesh(doorGeom, doorMaterial);
    doorMesh.castShadow = true;
    doorPivot.add(doorMesh);
    raycastTargets.push(doorMesh);

    // Tirador minimalista de oro rosa
    latchPivot = new THREE.Group();
    latchPivot.position.set(0, dh + dr * 0.5, 0.6);
    doorPivot.add(latchPivot);

    const handleGeom = new THREE.CylinderGeometry(0.2, 0.2, 4.2, 16);
    handleGeom.rotateZ(Math.PI / 2);
    disposables.push(handleGeom);
    const handleMesh = new THREE.Mesh(handleGeom, trimMaterial);
    latchPivot.add(handleMesh);

    // Banderín lateral en -X con corazón
    flagPivot = new THREE.Group();
    flagPivot.position.set(-r - 0.15, bodyHeight * 0.8, 3.5);
    group.add(flagPivot);

    const flagArmGeom = new THREE.CylinderGeometry(0.12, 0.12, 6.0, 12);
    flagArmGeom.translate(0, 3.0, 0);
    disposables.push(flagArmGeom);
    const flagArm = new THREE.Mesh(flagArmGeom, flagArmMaterial);
    flagPivot.add(flagArm);

    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, 0.2);
    heartShape.bezierCurveTo(0, 0.2, -0.6, 0.9, -0.6, 1.6);
    heartShape.bezierCurveTo(-0.6, 2.3, 0, 2.8, 0, 3.4);
    heartShape.bezierCurveTo(0, 2.8, 0.6, 2.3, 0.6, 1.6);
    heartShape.bezierCurveTo(0.6, 0.9, 0, 0.2, 0, 0.2);
    heartShape.closePath();

    const heartBladeGeom = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
    });
    disposables.push(heartBladeGeom);
    heartBladeGeom.translate(0, 4.0, 0);
    const heartBlade = new THREE.Mesh(heartBladeGeom, flagBladeMaterial);
    flagPivot.add(heartBlade);

  } else {
    // -------------------------------------------------------------------------
    // MODELO 3: CLÁSICO IMPERIAL (Bóveda rural tradicional)
    // -------------------------------------------------------------------------
    const r = 7.4;
    const bodyHeight = 5.8;

    const classicShape = new THREE.Shape();
    classicShape.moveTo(-r, 0);
    classicShape.lineTo(r, 0);
    classicShape.lineTo(r, bodyHeight);
    classicShape.absarc(0, bodyHeight, r, 0, Math.PI, false);
    classicShape.lineTo(-r, 0);

    const classicHole = new THREE.Path();
    const t = 0.65;
    const ir = r - t;
    const ih = bodyHeight;
    classicHole.moveTo(-ir, t);
    classicHole.lineTo(ir, t);
    classicHole.lineTo(ir, ih);
    classicHole.absarc(0, ih, ir, 0, Math.PI, false);
    classicHole.lineTo(-ir, t);
    classicShape.holes.push(classicHole);

    const classicGeom = new THREE.ExtrudeGeometry(classicShape, {
      depth: lengthZ,
      bevelEnabled: true,
      bevelThickness: 0.15,
      bevelSize: 0.15,
      bevelSegments: 3,
      curveSegments: 36,
    });
    disposables.push(classicGeom);
    classicGeom.translate(0, 0, -halfZ);

    const classicMesh = new THREE.Mesh(classicGeom, bodyMaterial);
    classicMesh.castShadow = true;
    classicMesh.receiveShadow = true;
    bodyGroup.add(classicMesh);

    // Tapa posterior
    const backGeom = new THREE.ExtrudeGeometry(classicShape, {
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
    });
    disposables.push(backGeom);
    backGeom.translate(0, 0, -halfZ - 0.7);
    const backMesh = new THREE.Mesh(backGeom, backMaterial);
    bodyGroup.add(backMesh);

    // Marco frontal abovedado de latón
    const frameGeom = new THREE.TorusGeometry(r, 0.38, 12, 36, Math.PI);
    disposables.push(frameGeom);
    const frameMesh = new THREE.Mesh(frameGeom, trimMaterial);
    frameMesh.position.set(0, bodyHeight, halfZ);
    bodyGroup.add(frameMesh);

    // Puerta frontal abovedada
    doorPivot = new THREE.Group();
    doorPivot.position.set(0, 0.35, halfZ);
    group.add(doorPivot);

    const dr = r - 0.15;
    const dh = bodyHeight - 0.1;
    const doorShape = new THREE.Shape();
    doorShape.moveTo(-dr, 0);
    doorShape.lineTo(dr, 0);
    doorShape.lineTo(dr, dh);
    doorShape.absarc(0, dh, dr, 0, Math.PI, false);
    doorShape.lineTo(-dr, 0);

    const doorGeom = new THREE.ExtrudeGeometry(doorShape, {
      depth: 0.6,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      curveSegments: 36,
    });
    disposables.push(doorGeom);
    const doorMesh = new THREE.Mesh(doorGeom, doorMaterial);
    doorMesh.castShadow = true;
    doorPivot.add(doorMesh);
    raycastTargets.push(doorMesh);

    // Pestillo superior abatible
    latchPivot = new THREE.Group();
    latchPivot.position.set(0, dh + dr - 0.5, 0.6);
    doorPivot.add(latchPivot);

    const latchTorusGeom = new THREE.TorusGeometry(0.85, 0.2, 12, 24);
    disposables.push(latchTorusGeom);
    const latchMesh = new THREE.Mesh(latchTorusGeom, trimMaterial);
    latchPivot.add(latchMesh);

    // Banderín postal tradicional en -X (izquierda)
    flagPivot = new THREE.Group();
    flagPivot.position.set(-r - 0.15, bodyHeight * 0.9, 4.0);
    group.add(flagPivot);

    const flagArmGeom = new THREE.CylinderGeometry(0.14, 0.14, 6.2, 10);
    flagArmGeom.translate(0, 3.1, 0);
    disposables.push(flagArmGeom);
    const flagArm = new THREE.Mesh(flagArmGeom, flagArmMaterial);
    flagPivot.add(flagArm);

    const flagBladeGeom = new THREE.BoxGeometry(0.15, 2.6, 3.2);
    flagBladeGeom.translate(0, 4.8, 1.4);
    disposables.push(flagBladeGeom);
    const flagBlade = new THREE.Mesh(flagBladeGeom, flagBladeMaterial);
    flagPivot.add(flagBlade);
  }

  // ===========================================================================
  // PLACA / RÓTULO CON LOS NOMBRES DE LA PAREJA EN EL COSTADO DERECHO (+X)
  // (Colocado en +X para que el banderín en -X nunca tape los nombres)
  // ===========================================================================
  const nameCanvas = document.createElement("canvas");
  nameCanvas.width = 1024;
  nameCanvas.height = 512;
  const nCtx = nameCanvas.getContext("2d");

  const renderNames = (names: string) => {
    if (!nCtx) return;
    nCtx.clearRect(0, 0, 1024, 512);

    // Fondo decorativo con esquinas redondeadas
    nCtx.fillStyle = "rgba(10, 20, 35, 0.45)";
    nCtx.beginPath();
    nCtx.roundRect(40, 40, 944, 432, 24);
    nCtx.fill();

    nCtx.strokeStyle = "rgba(236, 178, 73, 0.65)";
    nCtx.lineWidth = 6;
    nCtx.stroke();

    nCtx.textAlign = "center";
    nCtx.textBaseline = "middle";

    nCtx.font = '700 32px "Inter", sans-serif';
    nCtx.fillStyle = "rgba(230, 245, 255, 0.85)";
    nCtx.fillText("★  BUZÓN FAMILIAR  ★", 512, 120);

    // Nombres caligráficos
    nCtx.font = 'bold 110px "Caveat", "Dancing Script", cursive, serif';
    nCtx.fillStyle = "#ffffff";
    nCtx.fillText(names, 512, 255);

    nCtx.font = '600 28px "Inter", sans-serif';
    nCtx.fillStyle = "rgba(220, 235, 255, 0.85)";
    nCtx.fillText("NUESTROS VIAJES · BUZÓN DE AVENTURAS", 512, 385);
  };

  renderNames(coupleNames);

  const nameTexture = new THREE.CanvasTexture(nameCanvas);
  nameTexture.anisotropy = 16;
  disposables.push(nameTexture);

  const namePlateGeom = new THREE.PlaneGeometry(16.5, 8.2);
  disposables.push(namePlateGeom);
  const namePlateMat = new THREE.MeshBasicMaterial({
    map: nameTexture,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide,
  });
  disposables.push(namePlateMat);

  const namePlateMesh = new THREE.Mesh(namePlateGeom, namePlateMat);
  // Colocada en el costado +X, mirando hacia la derecha
  const lateralX = modelo === "vintage" ? 7.55 : 7.45;
  namePlateMesh.position.set(lateralX + 0.05, 5.8, 0);
  namePlateMesh.rotation.y = Math.PI / 2;
  group.add(namePlateMesh);

  // ===========================================================================
  // POSTE INFERIOR Y BASE DE MADERA / METAL
  // ===========================================================================
  const postGroup = new THREE.Group();
  postGroup.position.set(0, -6.5, 0);
  group.add(postGroup);

  const postGeom = new THREE.CylinderGeometry(0.85, 0.95, 13, 24);
  disposables.push(postGeom);
  const postMesh = new THREE.Mesh(postGeom, postMaterial);
  postMesh.castShadow = true;
  postMesh.receiveShadow = true;
  postGroup.add(postMesh);

  const bracketGeom = new THREE.BoxGeometry(10, 0.6, 15);
  disposables.push(bracketGeom);
  const bracketMesh = new THREE.Mesh(bracketGeom, trimMaterial);
  bracketMesh.position.set(0, 6.2, 0);
  bracketMesh.castShadow = true;
  postGroup.add(bracketMesh);

  // Sombra radial proyectada en el suelo
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext("2d");
  if (sCtx) {
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
    grad.addColorStop(0.5, "rgba(0, 0, 0, 0.3)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);
  }
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  disposables.push(shadowTexture);

  const shadowGeom = new THREE.PlaneGeometry(32, 32);
  disposables.push(shadowGeom);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
  });
  disposables.push(shadowMat);

  const shadowPlane = new THREE.Mesh(shadowGeom, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, -12.8, 0);
  group.add(shadowPlane);

  // Luz cálida interior
  const interiorLight = new THREE.PointLight(0xffdf88, 0, 22, 1.4);
  interiorLight.position.set(0, 5.0, 0);
  group.add(interiorLight);

  // Ángulo de apertura de la puerta: cae HACIA ADELANTE Y ABAJO (+X rotation ~95°)
  const doorTargetAngle = Math.PI * 0.54;

  const updateCoupleNames = (names: string) => {
    renderNames(names);
    nameTexture.needsUpdate = true;
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    group,
    doorPivot,
    flagPivot,
    latchPivot,
    keyPivot,
    interiorLight,
    doorTargetAngle,
    raycastTargets,
    updateCoupleNames,
    dispose,
  };
}
