"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { ICitaResponse, RolUsuario } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { LoveLetterView } from "@/components/citas/LoveLetterView";
import { Seal } from "@/components/ui/Seal";
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  User,
  Heart,
  ArrowRight,
  Sparkles,
  QrCode,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Compass,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export type MailboxStage =
  | "lateral_login"
  | "rotating_to_front"
  | "front_closed"
  | "door_opening"
  | "letters_floating"
  | "letter_expanded"
  | "docking"
  | "minimized_widget";

interface Mailbox3DExperienceProps {
  initialStage?: MailboxStage;
  pendingCitas?: ICitaResponse[];
  onCitaUpdated?: (updatedCita: ICitaResponse) => void;
  onCloseToDashboard?: () => void;
  isLoginScreen?: boolean;
}

export function Mailbox3DExperience({
  initialStage = "lateral_login",
  pendingCitas = [],
  onCitaUpdated,
  onCloseToDashboard,
  isLoginScreen = false,
}: Mailbox3DExperienceProps) {
  const { login, register } = useAuth();

  // Estados del flujo del buzón
  const [stage, setStage] = useState<MailboxStage>(initialStage);
  const [selectedLetter, setSelectedLetter] = useState<ICitaResponse | null>(null);
  const [activeEnvelopeIndex, setActiveEnvelopeIndex] = useState(0);

  useEffect(() => {
    if (initialStage) {
      setStage(initialStage);
    }
  }, [initialStage]);

  // Estados del formulario en la etiqueta adhesiva lateral
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<RolUsuario>("novia");
  const [email, setEmail] = useState("novia@velada.app");
  const [password, setPassword] = useState("NoviaVelada2026!");

  // Registro en la etiqueta adhesiva
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<RolUsuario>("novia");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLabelDisappearing, setIsLabelDisappearing] = useState(false);

  // Referencias para el canvas Three.js WebGL + CSS3D
  const mountRef = useRef<HTMLDivElement>(null);
  const labelDomRef = useRef<HTMLDivElement>(null);

  // Referencias para el bucle de animación de Three.js
  const animStateRef = useRef({
    targetRotY: -Math.PI * 0.42,
    targetDoorRotX: 0,
    targetLightIntensity: 0,
    targetPosX: 1.5,
    targetScale: 1,
    hasUnread: pendingCitas.length > 0,
    showLabel: true,
  });

  // Actualizar targets de animación Three.js según el stage
  useEffect(() => {
    const s = animStateRef.current;
    s.hasUnread = pendingCitas.length > 0;
    s.showLabel = stage === "lateral_login" && !isLabelDisappearing;

    switch (stage) {
      case "lateral_login":
        s.targetRotY = -Math.PI * 0.42; // -75°: cara lateral de frente al usuario
        s.targetDoorRotX = 0;
        s.targetLightIntensity = 0;
        s.targetPosX = 1.2;
        s.targetScale = 1;
        break;
      case "rotating_to_front":
        s.targetRotY = 0; // Frente a la cámara
        s.targetDoorRotX = 0;
        s.targetLightIntensity = 0;
        s.targetPosX = 0;
        s.targetScale = 0.94;
        break;
      case "front_closed":
        s.targetRotY = 0;
        s.targetDoorRotX = 0;
        s.targetLightIntensity = 0;
        s.targetPosX = 0;
        s.targetScale = 1;
        break;
      case "door_opening":
      case "letters_floating":
        s.targetRotY = 0;
        s.targetDoorRotX = -Math.PI * 0.65; // Puerta abatida hacia abajo
        s.targetLightIntensity = 2.8; // Luz cálida interior
        s.targetPosX = 0;
        s.targetScale = 1;
        break;
      case "letter_expanded":
        s.targetRotY = -0.05;
        s.targetDoorRotX = -Math.PI * 0.65;
        s.targetLightIntensity = 2.2;
        s.targetPosX = 0;
        s.targetScale = 0.85;
        break;
      case "docking":
      case "minimized_widget":
        s.targetRotY = 0.15;
        s.targetDoorRotX = 0;
        s.targetLightIntensity = 0;
        s.targetPosX = 0;
        s.targetScale = 0.28;
        break;
    }
  }, [stage, pendingCitas.length, isLabelDisappearing]);

  // Selección rápida de roles
  const handleRoleChange = (selectedRole: RolUsuario) => {
    setRole(selectedRole);
    setAuthError(null);
    if (selectedRole === "novio") {
      setEmail("novio@velada.app");
      setPassword("NovioVelada2026!");
    } else {
      setEmail("novia@velada.app");
      setPassword("NoviaVelada2026!");
    }
  };

  // Login en la etiqueta postal lateral
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Por favor completa tu correo y contraseña.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setIsLabelDisappearing(true);

    try {
      const res = await login(email, password, {
        delayCommitMs: 1400,
        onPreCommit: () => {
          setStage("rotating_to_front");
          try {
            sessionStorage.setItem("mailbox_auto_open", "true");
            sessionStorage.setItem("mailbox_stage", "front_closed");
          } catch {}
        },
      });
      if (!res.success) {
        setIsLabelDisappearing(false);
        setAuthError(res.error || "No se pudo iniciar sesión. Revisa tus credenciales.");
        setAuthLoading(false);
      } else {
        setStage("front_closed");
      }
    } catch {
      setIsLabelDisappearing(false);
      setAuthError("Error de comunicación con el servidor.");
      setAuthLoading(false);
    }
  };

  // Registro en la etiqueta postal lateral
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNombre || !regEmail || !regPassword) {
      setAuthError("Completa todos los datos para crear tu buzón.");
      return;
    }
    if (regPassword.length < 6) {
      setAuthError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setIsLabelDisappearing(true);

    try {
      const res = await register(
        {
          nombre: regNombre,
          email: regEmail,
          password: regPassword,
          rol: regRole,
        },
        {
          delayCommitMs: 1400,
          onPreCommit: () => {
            setStage("rotating_to_front");
            try {
              sessionStorage.setItem("mailbox_auto_open", "true");
              sessionStorage.setItem("mailbox_stage", "front_closed");
            } catch {}
          },
        }
      );

      if (!res.success) {
        setIsLabelDisappearing(false);
        setAuthError(res.error || "No se pudo registrar la cuenta.");
        setAuthLoading(false);
      } else {
        setStage("front_closed");
      }
    } catch {
      setIsLabelDisappearing(false);
      setAuthError("Error al registrar perfil.");
      setAuthLoading(false);
    }
  };

  // Interacción en la puerta del buzón 3D
  const handleDoorClick = useCallback(() => {
    if (stage === "front_closed") {
      setStage("door_opening");
      setTimeout(() => {
        setStage("letters_floating");
      }, 650);
    } else if (stage === "door_opening" || stage === "letters_floating") {
      setStage("front_closed");
    }
  }, [stage]);

  // Click en sobre flotante
  const handleEnvelopeClick = (cita: ICitaResponse) => {
    setSelectedLetter(cita);
    setStage("letter_expanded");
  };

  // Cerrar/responder carta y guardar en tablero
  const handleCloseExpandedLetter = () => {
    setSelectedLetter(null);
    setStage("docking");
    setTimeout(() => {
      setStage("minimized_widget");
      onCloseToDashboard?.();
    }, 950);
  };

  // Restaurar buzón al centro desde el widget miniatura
  const handleRestoreFromWidget = () => {
    setStage("front_closed");
  };

  // =========================================================================
  // MONTAJE DEL MOTOR THREE.JS (WebGL Sólido + CSS3DRenderer para Etiqueta)
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Escena y Cámara en Perspectiva
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 38);
    camera.lookAt(0, 3, 0);

    // 2. Renderizador WebGL con Antialiasing y Fondo Transparente
    const webglRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    webglRenderer.setSize(width, height);
    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    webglRenderer.shadowMap.enabled = true;
    webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    webglRenderer.domElement.style.position = "absolute";
    webglRenderer.domElement.style.top = "0";
    webglRenderer.domElement.style.left = "0";
    webglRenderer.domElement.style.width = "100%";
    webglRenderer.domElement.style.height = "100%";
    webglRenderer.domElement.style.pointerEvents = "none";
    container.appendChild(webglRenderer.domElement);

    // 3. Renderizador CSS3D para la etiqueta adhesiva en el costado
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(width, height);
    cssRenderer.domElement.style.position = "absolute";
    cssRenderer.domElement.style.top = "0";
    cssRenderer.domElement.style.left = "0";
    cssRenderer.domElement.style.width = "100%";
    cssRenderer.domElement.style.height = "100%";
    cssRenderer.domElement.style.pointerEvents = "none";
    container.appendChild(cssRenderer.domElement);

    // 4. Luces de la Escena (Realismo Metálico y Cálido)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.6);
    sunLight.position.set(20, 35, 25);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x8ec3f5, 0.7);
    rimLight.position.set(-25, 10, -20);
    scene.add(rimLight);

    // Luz cálida interior del buzón
    const interiorLight = new THREE.PointLight(0xffd57a, 0, 18, 1.5);
    interiorLight.position.set(0, 4.5, 0);
    scene.add(interiorLight);

    // =========================================================================
    // CONSTRUCCIÓN DEL MODELO 3D REALISTA Y SÓLIDO (ExtrudeGeometry sin fisuras)
    // =========================================================================
    const mailboxGroup = new THREE.Group();
    scene.add(mailboxGroup);

    // Dimensiones canónicas del buzón:
    // Ancho = 15, Alto Base = 5.5, Radio Curvo Domo = 7.5, Profundidad Z = 22
    const wallThickness = 0.5;
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(-7.5, 0);
    bodyShape.lineTo(-7.5, 5.5);
    bodyShape.absarc(0, 5.5, 7.5, Math.PI, 0, true);
    bodyShape.lineTo(7.5, 0);
    bodyShape.closePath();

    // Cavidad interior hueca (Hole)
    const innerHole = new THREE.Path();
    innerHole.moveTo(-7.5 + wallThickness, wallThickness);
    innerHole.lineTo(-7.5 + wallThickness, 5.5);
    innerHole.absarc(0, 5.5, 7.5 - wallThickness, Math.PI, 0, true);
    innerHole.lineTo(7.5 - wallThickness, wallThickness);
    innerHole.closePath();
    bodyShape.holes.push(innerHole);

    // Geometría continua y estanca del túnel del buzón
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 22,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.18,
      bevelThickness: 0.18,
    });
    // Centrar en Z (de -11 a +11)
    bodyGeometry.translate(0, 0, -11);

    // Material de Chapa Metálica Azul Postal Esmaltada
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x6290bd,
      roughness: 0.32,
      metalness: 0.22,
    });

    const bodyMesh = new THREE.Mesh(bodyGeometry, metalMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    mailboxGroup.add(bodyMesh);

    // Pared trasera que cierra el fondo del buzón (en Z = -11)
    const backShape = new THREE.Shape();
    backShape.moveTo(-7.5, 0);
    backShape.lineTo(-7.5, 5.5);
    backShape.absarc(0, 5.5, 7.5, Math.PI, 0, true);
    backShape.lineTo(7.5, 0);
    backShape.closePath();
    const backGeometry = new THREE.ShapeGeometry(backShape);
    backGeometry.translate(0, 0, -11.02);
    const backMesh = new THREE.Mesh(
      backGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x517a9e,
        roughness: 0.45,
        metalness: 0.2,
      })
    );
    mailboxGroup.add(backMesh);

    // Suelo interior de correspondencia
    const shelfGeom = new THREE.BoxGeometry(13.8, 0.3, 21.6);
    const shelfMesh = new THREE.Mesh(
      shelfGeom,
      new THREE.MeshStandardMaterial({
        color: 0x1d3045,
        roughness: 0.7,
      })
    );
    shelfMesh.position.set(0, wallThickness * 0.5, 0);
    mailboxGroup.add(shelfMesh);

    // =========================================================================
    // PUERTA FRONTAL BASCULANTE CON BISAGRA EN LA BASE (Z = +11)
    // =========================================================================
    const doorPivot = new THREE.Group();
    doorPivot.position.set(0, 0.1, 11.05);
    mailboxGroup.add(doorPivot);

    const doorShape = new THREE.Shape();
    doorShape.moveTo(-7.4, 0);
    doorShape.lineTo(-7.4, 5.4);
    doorShape.absarc(0, 5.4, 7.4, Math.PI, 0, true);
    doorShape.lineTo(7.4, 0);
    doorShape.closePath();

    const doorGeometry = new THREE.ExtrudeGeometry(doorShape, {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.12,
    });
    const doorMesh = new THREE.Mesh(
      doorGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x6896c2,
        roughness: 0.28,
        metalness: 0.25,
      })
    );
    doorPivot.add(doorMesh);

    // Bisagras de latón dorado en la base
    const hingeGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 12);
    hingeGeom.rotateZ(Math.PI / 2);
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xe5be73,
      metalness: 0.85,
      roughness: 0.25,
    });
    const leftHinge = new THREE.Mesh(hingeGeom, brassMaterial);
    leftHinge.position.set(-5.5, 0.15, 0.3);
    doorPivot.add(leftHinge);

    const rightHinge = new THREE.Mesh(hingeGeom, brassMaterial);
    rightHinge.position.set(5.5, 0.15, 0.3);
    doorPivot.add(rightHinge);

    // Pestillo y Tirador Dorado de Apertura
    const latchGeom = new THREE.TorusGeometry(0.9, 0.22, 12, 24);
    const latchMesh = new THREE.Mesh(latchGeom, brassMaterial);
    latchMesh.position.set(0, 4.6, 0.65);
    doorPivot.add(latchMesh);

    // =========================================================================
    // BANDERÍN POSTAL ROJO EN EL COSTADO
    // =========================================================================
    const flagPivot = new THREE.Group();
    flagPivot.position.set(7.62, 5.2, 4.5);
    mailboxGroup.add(flagPivot);

    const flagArmGeom = new THREE.CylinderGeometry(0.14, 0.14, 6.2, 10);
    flagArmGeom.translate(0, 3.1, 0);
    const flagArm = new THREE.Mesh(
      flagArmGeom,
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
    );
    flagPivot.add(flagArm);

    const flagBladeGeom = new THREE.BoxGeometry(0.12, 2.4, 3.8);
    flagBladeGeom.translate(0, 5.2, 1.8);
    const flagBlade = new THREE.Mesh(
      flagBladeGeom,
      new THREE.MeshStandardMaterial({
        color: 0xd93850,
        roughness: 0.35,
        metalness: 0.15,
      })
    );
    flagPivot.add(flagBlade);

    // =========================================================================
    // POSTE DE MADERA RÚSTICA DE APOYO
    // =========================================================================
    const postGeom = new THREE.BoxGeometry(2.4, 18, 2.4);
    const postMesh = new THREE.Mesh(
      postGeom,
      new THREE.MeshStandardMaterial({
        color: 0x5a3d28,
        roughness: 0.85,
        metalness: 0.05,
      })
    );
    postMesh.position.set(0, -9, 0);
    mailboxGroup.add(postMesh);

    // Placa soporte horizontal de madera bajo el buzón
    const supportBracket = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.8, 14),
      new THREE.MeshStandardMaterial({ color: 0x48301e, roughness: 0.9 })
    );
    supportBracket.position.set(0, -0.4, 0);
    mailboxGroup.add(supportBracket);

    // Sombra de contacto suave en el piso
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext("2d");
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
      grad.addColorStop(0, "rgba(10, 25, 40, 0.5)");
      grad.addColorStop(0.4, "rgba(10, 25, 40, 0.25)");
      grad.addColorStop(1, "rgba(10, 25, 40, 0)");
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 42),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -17.8, 0);
    scene.add(shadowPlane);

    // =========================================================================
    // LITERALMENTE PINTADO EN EL METAL DEL BUZÓN: SAMUEL Y DIANA
    // (Renderizado con CanvasTexture de alta resolución integrado a la chapa)
    // =========================================================================
    const paintCanvas = document.createElement("canvas");
    paintCanvas.width = 1024;
    paintCanvas.height = 320;
    const pCtx = paintCanvas.getContext("2d");
    if (pCtx) {
      pCtx.clearRect(0, 0, 1024, 320);

      // Trazo al óleo y sombra de relieve sobre el metal
      pCtx.font = "bold 82px var(--font-caveat), 'Brush Script MT', cursive";
      pCtx.textAlign = "center";
      pCtx.textBaseline = "middle";

      // Sombra profunda pintada
      pCtx.fillStyle = "rgba(15, 35, 60, 0.75)";
      pCtx.fillText("Samuel & Diana", 512 + 2, 110 + 3);

      // Pintura blanca acrílica con textura
      pCtx.fillStyle = "#FFFFFF";
      pCtx.fillText("Samuel & Diana", 512, 110);

      // Subtítulo pintado en plantilla
      pCtx.font = "600 24px var(--font-sans), sans-serif";
      pCtx.fillStyle = "rgba(225, 240, 255, 0.95)";
      pCtx.letterSpacing = "6px";
      pCtx.fillText("NUESTROS VIAJES · BUZÓN FAMILIAR", 512, 190);

      // Pincelada artesanal decorativa inferior
      pCtx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      pCtx.lineWidth = 5;
      pCtx.beginPath();
      pCtx.moveTo(280, 230);
      pCtx.quadraticCurveTo(512, 215, 744, 230);
      pCtx.stroke();
    }

    const paintTexture = new THREE.CanvasTexture(paintCanvas);
    paintTexture.anisotropy = 4;
    const paintPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 5.6),
      new THREE.MeshStandardMaterial({
        map: paintTexture,
        transparent: true,
        roughness: 0.35,
        metalness: 0.2,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      })
    );
    paintPlate.position.set(7.55, 7.8, 0);
    paintPlate.rotation.y = Math.PI / 2;
    mailboxGroup.add(paintPlate);

    // =========================================================================
    // ETIQUETA ADHESIVA DE LOGIN PEGADA AL COSTADO (CSS3DObject en X = +7.55)
    // =========================================================================
    const labelDom = labelDomRef.current;
    let cssObject: CSS3DObject | null = null;
    if (labelDom) {
      cssObject = new CSS3DObject(labelDom);
      // Ubicar justo debajo de los nombres pintados, pegada a la chapa metálica
      cssObject.position.set(7.58, 2.7, 0);
      cssObject.rotation.y = Math.PI / 2;
      cssObject.scale.set(0.046, 0.046, 0.046);
      mailboxGroup.add(cssObject);
    }

    // =========================================================================
    // BUCLE DE ANIMACIÓN CONTINUA (Física suave sin saltos)
    // =========================================================================
    let animId: number;
    let currRotY = animStateRef.current.targetRotY;
    let currDoorRotX = 0;
    let currLight = 0;
    let currPosX = animStateRef.current.targetPosX;
    let currScale = 1;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const s = animStateRef.current;

      // Suavizado exponencial (Damping)
      currRotY += (s.targetRotY - currRotY) * Math.min(delta * 5.5, 1);
      currDoorRotX += (s.targetDoorRotX - currDoorRotX) * Math.min(delta * 6.5, 1);
      currLight += (s.targetLightIntensity - currLight) * Math.min(delta * 7, 1);
      currPosX += (s.targetPosX - currPosX) * Math.min(delta * 5.5, 1);
      currScale += (s.targetScale - currScale) * Math.min(delta * 5, 1);

      // Aplicar transformaciones al Buzón 3D
      mailboxGroup.rotation.y = currRotY;
      mailboxGroup.position.x = currPosX;
      mailboxGroup.scale.set(currScale, currScale, currScale);

      doorPivot.rotation.x = currDoorRotX;
      interiorLight.intensity = currLight;

      if (cssObject) {
        cssObject.visible = s.showLabel;
      }

      // Animación suave del banderín cuando hay cartas pendientes
      if (s.hasUnread) {
        flagPivot.rotation.z = Math.sin(elapsed * 2.5) * 0.05;
      } else {
        flagPivot.rotation.z = 1.45; // Abajo
      }

      webglRenderer.render(scene, camera);
      cssRenderer.render(scene, camera);
    };

    animate();

    // Manejo de redimensionado de ventana
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      webglRenderer.setSize(width, height);
      cssRenderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);

      if (container.contains(webglRenderer.domElement)) {
        container.removeChild(webglRenderer.domElement);
      }
      if (container.contains(cssRenderer.domElement)) {
        container.removeChild(cssRenderer.domElement);
      }

      bodyGeometry.dispose();
      backGeometry.dispose();
      doorGeometry.dispose();
      hingeGeom.dispose();
      latchGeom.dispose();
      flagArmGeom.dispose();
      flagBladeGeom.dispose();
      postGeom.dispose();
      shadowPlane.geometry.dispose();
      metalMaterial.dispose();
      brassMaterial.dispose();
      paintTexture.dispose();
      shadowTex.dispose();
      webglRenderer.dispose();
    };
  }, []);

  // Si está minimizado como widget interactivo en la esquina
  if (stage === "minimized_widget") {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-up select-none">
        <motion.button
          type="button"
          onClick={handleRestoreFromWidget}
          whileHover={{ scale: 1.08, rotate: -2 }}
          whileTap={{ scale: 0.94 }}
          className="group relative flex items-center gap-3 bg-white/95 backdrop-blur-md p-2.5 pr-4 rounded-2xl shadow-letter border border-sky-200/90 text-left cursor-pointer transition-all hover:shadow-xl hover:border-sky-300"
          title="Abrir Buzón 3D de Nuestras Aventuras"
        >
          <div className="relative w-12 h-12 flex-shrink-0 bg-sky-100/70 rounded-xl flex items-center justify-center overflow-hidden border border-sky-200">
            <svg viewBox="0 0 100 100" className="w-10 h-10 drop-shadow-xs">
              <rect x="46" y="60" width="8" height="35" rx="2" fill="#8A6B53" />
              <rect x="20" y="30" width="60" height="36" rx="18" fill="#89B8E6" />
              <path
                d="M 20 48 C 20 38 28 30 38 30 L 62 30 C 72 30 80 38 80 48 Z"
                fill="#A4C9EE"
              />
              <ellipse cx="35" cy="48" rx="11" ry="15" fill="#6B9BC9" />
              <circle cx="35" cy="48" r="3.5" fill="#E5BE73" />
              <line x1="72" y1="48" x2="84" y2="30" stroke="#C76D80" strokeWidth="2.5" />
              <path d="M 84 30 L 92 32 L 84 37 Z" fill="#C76D80" />
            </svg>

            {pendingCitas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-handwriting text-base font-bold text-sky-950 leading-tight">
                Samuel & Diana
              </span>
              {pendingCitas.length > 0 && (
                <span className="bg-blush-100 text-blush-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-blush-200 font-mono">
                  {pendingCitas.length}
                </span>
              )}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-sky-700/80">
              {pendingCitas.length > 0 ? "Cartas pendientes" : "Buzón al día"}
            </p>
          </div>

          <Maximize2
            size={14}
            className="text-sky-600 opacity-60 group-hover:opacity-100 transition-opacity ml-1"
          />
        </motion.button>
      </div>
    );
  }

  return (
    <div
      className={
        isLoginScreen
          ? "relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
          : `fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ${
              stage === "docking"
                ? "bg-transparent backdrop-blur-none pointer-events-none"
                : "bg-[#101D2B]/75 backdrop-blur-md"
            }`
      }
    >
      {/* Botón superior de cerrar hacia el dashboard si no es login */}
      {!isLoginScreen && stage !== "lateral_login" && (
        <button
          type="button"
          onClick={() => {
            setStage("docking");
            setTimeout(() => {
              setStage("minimized_widget");
              onCloseToDashboard?.();
            }, 900);
          }}
          className="fixed top-5 right-5 z-50 p-2.5 rounded-full bg-white/90 hover:bg-white text-ink-soft hover:text-ink shadow-md transition-transform hover:scale-105 cursor-pointer border border-sky-100"
          title="Minimizar buzón e ir al tablero"
        >
          <X size={18} />
        </button>
      )}

      {/* LIENZO 3D THREE.JS (Contenedor de WebGL y CSS3D) */}
      <div
        ref={mountRef}
        onClick={() => {
          if (stage === "front_closed") {
            handleDoorClick();
          }
        }}
        className={`relative w-full h-[620px] sm:h-[680px] flex items-center justify-center select-none ${
          stage === "front_closed" ? "cursor-pointer" : ""
        }`}
      />

      {/* ========================================================================= */}
      {/* LA ETIQUETA ADHESIVA DE ACCESO (Inyectada al CSS3DRenderer en el Costado) */}
      {/* ========================================================================= */}
      <div style={{ display: "none" }}>
        <div
          ref={labelDomRef}
          style={{
            opacity: stage === "lateral_login" && !isLabelDisappearing ? 1 : 0,
            transform:
              stage === "lateral_login" && !isLabelDisappearing
                ? "scale(1)"
                : "scale(0.8)",
            transition:
              "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents:
              stage === "lateral_login" && !isLabelDisappearing ? "auto" : "none",
          }}
          className="w-[370px] bg-gradient-to-b from-[#FAF8EE] to-[#F1E9D2] rounded-xl p-4 text-center border-2 border-dashed border-[#D2C5A7] shadow-[0_10px_25px_rgba(10,25,50,0.35)] select-text"
        >
          {/* Cabecera de la Etiqueta Postal */}
          <div className="flex items-center justify-between border-b border-[#E3D8C1] pb-1.5 mb-2.5">
            <div className="flex items-center gap-1.5 text-left">
              <Compass size={13} className="text-[#9A7D46]" />
              <span className="font-mono text-[8.5px] uppercase tracking-wider font-bold text-[#8A6C35]">
                Etiqueta Postal de Acceso
              </span>
            </div>
            <span className="font-mono text-[8px] text-[#A68F63] font-bold">
              FOLIO: NA-2026
            </span>
          </div>

          {/* Selector de modo Login / Registro */}
          <div className="flex p-0.5 bg-[#ECE3CE] rounded-lg mb-2.5 border border-[#D9CEB5]">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthError(null);
              }}
              className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-white text-sky-950 shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Identificarme
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setAuthError(null);
              }}
              className={`flex-1 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                authMode === "register"
                  ? "bg-white text-sky-950 shadow-xs"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Crear Perfil QR
            </button>
          </div>

          {authError && (
            <div className="mb-2.5 p-2 rounded-lg bg-blush-100/90 border border-blush-300 text-ink text-left text-[10.5px] flex items-start gap-1.5">
              <AlertCircle size={13} className="text-blush-600 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authMode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-2 text-left">
              {/* Sellos de selección de destinatario */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange("novio")}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === "novio"
                      ? "border-sky-500 bg-sky-100 text-sky-950 shadow-xs"
                      : "border-[#D9CEB5] bg-white/70 text-ink-soft hover:bg-sky-50/50"
                  }`}
                >
                  <User size={12} className="text-sky-700" />
                  <span>Samuel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("novia")}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    role === "novia"
                      ? "border-blush-400 bg-blush-100 text-blush-950 shadow-xs"
                      : "border-[#D9CEB5] bg-white/70 text-ink-soft hover:bg-blush-50/50"
                  }`}
                >
                  <Heart size={12} className="text-blush-500 fill-blush-400" />
                  <span>Diana</span>
                </button>
              </div>

              {/* Campo Correo */}
              <div>
                <label className="block text-[9.5px] font-bold uppercase tracking-wider text-ink-soft mb-0.5">
                  Correo Postal
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full py-1.5 px-2.5 pl-8 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                  />
                  <Mail
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-700 opacity-75"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="block text-[9.5px] font-bold uppercase tracking-wider text-ink-soft mb-0.5">
                  Contraseña Secreta
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-1.5 px-2.5 pl-8 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                  />
                  <Lock
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-700 opacity-75"
                  />
                </div>
              </div>

              {/* Botón de Entrada */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-sky-700 hover:bg-sky-800 text-white font-sans font-bold text-xs py-2.5 px-4 rounded-xl hover:shadow-md transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Abriendo cerrojo...</span>
                    </>
                  ) : (
                    <>
                      <span>Timbrar y Entrar al Buzón</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-2 text-left">
              <div>
                <label className="block text-[9px] font-bold uppercase text-ink-soft mb-0.5">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="ej. Samuel, Diana..."
                  className="w-full py-1.5 px-2.5 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink-soft mb-0.5">
                  Correo
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full py-1.5 px-2.5 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink-soft mb-0.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full py-1.5 px-2.5 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-sky-700 hover:bg-sky-800 text-white font-sans font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <QrCode size={13} />
                      <span>Crear Buzón y Generar QR</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Indicador táctil para abrir la puerta cuando el buzón está de frente y cerrado */}
      {stage === "front_closed" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={handleDoorClick}
          className="absolute bottom-10 z-40 flex flex-col items-center cursor-pointer"
        >
          <div className="bg-white/95 text-sky-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg border border-sky-100 flex items-center gap-2 hover:scale-105 transition-transform">
            <Heart size={15} className="fill-blush-400 text-blush-400 animate-ping" />
            <span>Toca la puerta del buzón para abrirlo</span>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SOBRES DE CARTAS FLOTANDO EN 3D FRENTE A LA PUERTA ABIERTA */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {stage === "letters_floating" && (
          <motion.div
            key="floating-envelopes"
            initial={{ opacity: 0, scale: 0.6, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 30 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-40 flex flex-col items-center justify-center pointer-events-auto"
          >
            {pendingCitas.length > 0 ? (
              <div className="flex flex-col items-center">
                {pendingCitas.length > 1 && (
                  <div className="flex items-center gap-2 mb-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-md border border-sky-100">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEnvelopeIndex((prev) =>
                          prev > 0 ? prev - 1 : pendingCitas.length - 1
                        )
                      }
                      className="p-1 rounded-full hover:bg-sky-100 text-sky-900 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-mono text-xs font-semibold text-sky-900">
                      {activeEnvelopeIndex + 1} de {pendingCitas.length} cartas
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEnvelopeIndex((prev) =>
                          prev < pendingCitas.length - 1 ? prev + 1 : 0
                        )
                      }
                      className="p-1 rounded-full hover:bg-sky-100 text-sky-900 transition-colors cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {(() => {
                  const cita = pendingCitas[activeEnvelopeIndex] || pendingCitas[0];
                  return (
                    <motion.div
                      key={cita.id}
                      animate={{
                        y: [0, -12, 0],
                        rotate: [-1.2, 1.2, -1.2],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3.5,
                        ease: "easeInOut",
                      }}
                      whileHover={{ scale: 1.05, y: -16 }}
                      onClick={() => handleEnvelopeClick(cita)}
                      className="group relative w-[290px] sm:w-[330px] h-[200px] sm:h-[220px] bg-[#FAF7F0] rounded-2xl shadow-2xl p-5 border border-[#E8DFC8] cursor-pointer flex flex-col justify-between select-none transition-all hover:shadow-[0_20px_40px_rgba(20,50,90,0.35)]"
                    >
                      <div
                        className="absolute inset-1.5 rounded-xl pointer-events-none opacity-40"
                        style={{
                          border: "1px dashed #C9A96E",
                        }}
                      />

                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#9A8150] block font-bold">
                            Correspondencia Especial
                          </span>
                          <span className="font-serif italic text-xs text-ink-soft">
                            Nuestras Aventuras
                          </span>
                        </div>

                        <div className="w-10 h-12 border-2 border-dashed border-[#C9A96E] bg-sky-50 rounded-sm flex flex-col items-center justify-center p-1 shadow-xs">
                          <Heart size={14} className="fill-blush-400 text-blush-500" />
                          <span className="font-mono text-[7px] text-sky-900 font-bold mt-1">
                            2026
                          </span>
                        </div>
                      </div>

                      <div className="self-center my-auto flex flex-col items-center">
                        <Seal size="md" className="group-hover:scale-110 transition-transform shadow-md" />
                        <p className="font-handwriting text-2xl text-sky-950 font-bold mt-2">
                          {cita.nombre}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#E8DFC8]/60 pt-2 text-[11px] text-ink-soft font-mono">
                        <span>Para: Diana</span>
                        <span>
                          {format(new Date(cita.horario), "d 'de' MMMM", { locale: es })}
                        </span>
                      </div>

                      <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                        <span className="bg-sky-700 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md group-hover:bg-sky-800 transition-colors flex items-center gap-1.5 font-sans">
                          <Sparkles size={11} />
                          <span>Toca para desplegar la carta</span>
                        </span>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-xl text-center max-w-sm">
                <Heart size={28} className="fill-sky-400 text-sky-500 mx-auto mb-2" />
                <h3 className="font-serif font-bold text-lg text-ink">Buzón al día</h3>
                <p className="text-xs text-ink-soft mt-1">
                  No tienes cartas pendientes por responder. Puedes revisar tu historial completo en el tablero.
                </p>
                <button
                  type="button"
                  onClick={handleCloseExpandedLetter}
                  className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Ir al Tablero Principal
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* VISTA DESPLEGADA DE LA CARTA (3 PESTAÑAS: CARTA, MAPA, POLAROID) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {stage === "letter_expanded" && selectedLetter && (
          <motion.div
            key="expanded-letter-modal"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#132233]/70 backdrop-blur-md"
          >
            <div className="w-full max-w-2xl my-auto">
              <LoveLetterView
                cita={selectedLetter}
                onClose={handleCloseExpandedLetter}
                onCitaUpdated={(updated) => {
                  onCitaUpdated?.(updated);
                  setSelectedLetter(updated);
                }}
                showCloseButton={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
