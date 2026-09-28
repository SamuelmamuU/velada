"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { ICitaResponse, RolUsuario, ModeloBuzon } from "@/types";
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
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";

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
  openTrigger?: number;
  pendingCitas?: ICitaResponse[];
  onCitaUpdated?: (updatedCita: ICitaResponse) => void;
  onCloseToDashboard?: () => void;
  isLoginScreen?: boolean;
}

/**
 * Geometría en decal curvado que abraza con precisión milimétrica la chapa
 * metálica exterior del buzón (cilindro superior y pared plana lateral).
 */
function createMailboxDecalGeometry(
  widthZ: number,
  arcRadius: number,
  thetaStart: number,
  thetaEnd: number,
  flatHeightBelow: number,
  segmentsZ = 36,
  segmentsArc = 36
): THREE.BufferGeometry {
  const geom = new THREE.PlaneGeometry(widthZ, 1, segmentsZ, segmentsArc);
  const pos = geom.attributes.position;
  const totalLength = flatHeightBelow + arcRadius * (thetaEnd - thetaStart);
  const flatFrac = flatHeightBelow / totalLength;

  for (let i = 0; i < pos.count; i++) {
    const pZ = -pos.getX(i);
    const t = pos.getY(i) + 0.5;

    let x: number;
    let y: number;

    if (t < flatFrac) {
      const subT = t / Math.max(flatFrac, 0.0001);
      x = arcRadius;
      y = 5.5 - flatHeightBelow + subT * flatHeightBelow;
    } else {
      const subT = (t - flatFrac) / Math.max(1 - flatFrac, 0.0001);
      const theta = thetaStart + subT * (thetaEnd - thetaStart);
      x = arcRadius * Math.cos(theta);
      y = 5.5 + arcRadius * Math.sin(theta);
    }

    pos.setXYZ(i, x, y, pZ);
  }

  geom.computeVertexNormals();
  return geom;
}

export function Mailbox3DExperience({
  initialStage = "lateral_login",
  openTrigger = 0,
  pendingCitas = [],
  onCitaUpdated,
  onCloseToDashboard,
  isLoginScreen = false,
}: Mailbox3DExperienceProps) {
  const { user, pareja, login, register } = useAuth();

  const novioName = user?.rol === "novio" ? user?.nombre : (user?.nombrePareja || pareja?.parejaNombre || "Novio");
  const noviaName = user?.rol === "novia" ? user?.nombre : (user?.nombrePareja || pareja?.parejaNombre || "Novia");
  const coupleNames = `${novioName} & ${noviaName}`;

  const coupleNamesRef = useRef(coupleNames);
  useEffect(() => {
    coupleNamesRef.current = coupleNames;
  }, [coupleNames]);

  // Estados del flujo del buzón
  const [stage, setStage] = useState<MailboxStage>(initialStage);
  const [selectedLetter, setSelectedLetter] = useState<ICitaResponse | null>(null);
  const [activeEnvelopeIndex, setActiveEnvelopeIndex] = useState(0);

  const [modeloBuzonState, setModeloBuzonState] = useState<ModeloBuzon>(
    (pareja?.modeloBuzon || "clasico") as ModeloBuzon
  );

  useEffect(() => {
    if (pareja?.modeloBuzon) {
      setModeloBuzonState(pareja.modeloBuzon as ModeloBuzon);
    } else {
      try {
        const stored = localStorage.getItem("velada_modelo_buzon");
        if (stored === "clasico" || stored === "vintage" || stored === "moderno") {
          setModeloBuzonState(stored as ModeloBuzon);
        }
      } catch {}
    }
  }, [pareja?.modeloBuzon]);

  useEffect(() => {
    const handleModeloChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setModeloBuzonState(customEvent.detail as ModeloBuzon);
      }
    };
    window.addEventListener("velada_modelo_buzon_changed", handleModeloChange);
    return () => {
      window.removeEventListener("velada_modelo_buzon_changed", handleModeloChange);
    };
  }, []);

  useEffect(() => {
    if (initialStage) {
      setStage(initialStage);
    }
  }, [initialStage]);

  useEffect(() => {
    if (openTrigger && openTrigger > 0) {
      setStage("front_closed");
      const openTimer = setTimeout(() => {
        setStage("door_opening");
      }, 300);
      return () => clearTimeout(openTimer);
    }
  }, [openTrigger]);

  useEffect(() => {
    if (stage === "door_opening") {
      const timer = setTimeout(() => {
        setStage("letters_floating");
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  useEffect(() => {
    if (stage !== "minimized_widget") {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Estados del formulario en la etiqueta adhesiva lateral
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registro en la etiqueta adhesiva
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<RolUsuario>("novia");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLabelDisappearing, setIsLabelDisappearing] = useState(false);

  // Referencias para el canvas Three.js WebGL + CSS3D
  const mountRef = useRef<HTMLDivElement>(null);
  const labelDomRef = useRef<HTMLDivElement>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mousePointerRef = useRef(new THREE.Vector2());

  // Control de arrastre orbital libre 360° en 3D
  const orbitStateRef = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    rotX: 0,
    rotY: 0,
    targetRotX: 0,
    targetRotY: -Math.PI * 0.5,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (stage === "letter_expanded" || stage === "lateral_login") return;
    orbitStateRef.current.isDragging = true;
    orbitStateRef.current.prevX = e.clientX;
    orbitStateRef.current.prevY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const orb = orbitStateRef.current;
    if (!orb.isDragging) return;
    const deltaX = e.clientX - orb.prevX;
    const deltaY = e.clientY - orb.prevY;
    orb.prevX = e.clientX;
    orb.prevY = e.clientY;

    orb.targetRotY += deltaX * 0.008;
    orb.targetRotX = Math.max(-0.6, Math.min(0.6, orb.targetRotX + deltaY * 0.006));
  };

  const handlePointerUp = () => {
    orbitStateRef.current.isDragging = false;
  };

  // Referencias para los targets de animación Three.js
  const animStateRef = useRef({
    stageBaseRotY: -Math.PI * 0.5,
    targetDoorRotX: 0,
    targetDoorZ: 11.05,
    targetKeyRotZ: 0,
    targetLatchRotX: 0,
    targetFlapRotX: 0,
    targetScrollUnroll: 0,
    targetGlassSlideX: 0,
    targetLightIntensity: 0,
    targetPosX: 0,
    targetScale: 1,
    hasUnread: pendingCitas.length > 0,
    showLabel: true,
  });

  // Actualizar targets de animación Three.js según el stage
  useEffect(() => {
    const s = animStateRef.current;
    const orb = orbitStateRef.current;
    s.hasUnread = pendingCitas.length > 0;
    s.showLabel = stage === "lateral_login" && !isLabelDisappearing;

    switch (stage) {
      case "lateral_login":
        s.stageBaseRotY = -Math.PI * 0.5;
        orb.targetRotY = -Math.PI * 0.5;
        orb.targetRotX = 0;
        s.targetDoorRotX = 0;
        s.targetDoorZ = 11.05;
        s.targetKeyRotZ = 0;
        s.targetLatchRotX = 0;
        s.targetFlapRotX = 0;
        s.targetScrollUnroll = 0;
        s.targetGlassSlideX = 0;
        s.targetLightIntensity = 0;
        s.targetPosX = 0;
        s.targetScale = 1;
        break;
      case "rotating_to_front":
        s.stageBaseRotY = 0;
        orb.targetRotY = 0;
        orb.targetRotX = 0;
        s.targetDoorRotX = 0;
        s.targetDoorZ = 11.05;
        s.targetKeyRotZ = 0;
        s.targetLatchRotX = 0;
        s.targetFlapRotX = 0;
        s.targetScrollUnroll = 0;
        s.targetGlassSlideX = 0;
        s.targetLightIntensity = 0;
        s.targetPosX = 0;
        s.targetScale = 0.94;
        break;
      case "front_closed":
        s.stageBaseRotY = 0;
        orb.targetRotY = 0;
        orb.targetRotX = 0;
        s.targetDoorRotX = 0;
        s.targetDoorZ = 11.05;
        s.targetKeyRotZ = 0;
        s.targetLatchRotX = 0;
        s.targetFlapRotX = 0;
        s.targetScrollUnroll = 0;
        s.targetGlassSlideX = 0;
        s.targetLightIntensity = 0;
        s.targetPosX = 0;
        s.targetScale = 1;
        break;
      case "door_opening":
      case "letters_floating":
        s.stageBaseRotY = 0;
        orb.targetRotY = 0;
        orb.targetRotX = 0.05;
        s.targetDoorRotX = -Math.PI * 0.48;
        s.targetDoorZ = modeloBuzonState === "moderno" ? 12.8 : 11.05;
        s.targetKeyRotZ = Math.PI * 0.5; // Giro 90° de la llave vintage en 3D
        s.targetLatchRotX = -Math.PI * 0.28; // Salto del cerrojo en 3D
        s.targetFlapRotX = -Math.PI * 0.95; // Solapa del sobre 3D se despliega en WebGL
        s.targetScrollUnroll = 1.0;
        s.targetGlassSlideX = -3.5;
        s.targetLightIntensity = 4.2; // Luz cálida interior brillante
        s.targetPosX = 0;
        s.targetScale = 1;
        break;
      case "letter_expanded":
        s.stageBaseRotY = -0.05;
        s.targetDoorRotX = -Math.PI * 0.48;
        s.targetDoorZ = modeloBuzonState === "moderno" ? 12.8 : 11.05;
        s.targetLightIntensity = 2.4;
        s.targetPosX = 0;
        s.targetScale = 0.85;
        break;
      case "docking":
      case "minimized_widget":
        s.stageBaseRotY = 0.15;
        orb.targetRotY = 0.15;
        orb.targetRotX = 0;
        s.targetDoorRotX = 0;
        s.targetDoorZ = 11.05;
        s.targetKeyRotZ = 0;
        s.targetLatchRotX = 0;
        s.targetFlapRotX = 0;
        s.targetScrollUnroll = 0;
        s.targetGlassSlideX = 0;
        s.targetLightIntensity = 0;
        s.targetPosX = 0;
        s.targetScale = 0.28;
        break;
    }
  }, [stage, pendingCitas.length, isLabelDisappearing, modeloBuzonState]);

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
      }, 750);
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
    setTimeout(() => {
      setStage("door_opening");
    }, 300);
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
    const isMobileDevice = typeof window !== "undefined" && window.innerWidth < 768;
    const cameraZ = isMobileDevice ? 44 : 38;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.2, cameraZ);
    camera.lookAt(0, 2.2, 0);

    // 2. Renderizador WebGL con Antialiasing y optimización de DPR para GPU móvil
    const maxDpr = isMobileDevice ? 1.75 : 2;

    const webglRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    webglRenderer.setSize(width, height);
    webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
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

    // 4. Luces de la Escena (Fotorrealismo Metálico y Enfoque Dramático)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaee, 2.05);
    sunLight.position.set(24, 38, 28);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x8ec3f5, 0.95);
    rimLight.position.set(-26, 14, -22);
    scene.add(rimLight);

    // Luz cálida interior del buzón
    const interiorLight = new THREE.PointLight(0xffd885, 0, 24, 1.5);
    interiorLight.position.set(0, 4.5, 0);
    scene.add(interiorLight);

    // =========================================================================
    // CONSTRUCCIÓN SÓLIDA Y ESTANCA DE 6 PANELES PARA EL BUZÓN 3D
    // =========================================================================
    const mailboxGroup = new THREE.Group();
    scene.add(mailboxGroup);

    const currentModelo = modeloBuzonState || "clasico";

    let metalMaterial: THREE.MeshStandardMaterial;
    let backMaterial: THREE.MeshStandardMaterial;
    let doorMaterial: THREE.MeshStandardMaterial;
    let brassMaterial: THREE.MeshStandardMaterial;
    let flagArmMaterial: THREE.MeshStandardMaterial;
    let flagBladeMaterial: THREE.MeshStandardMaterial;
    let postMaterial: THREE.MeshStandardMaterial;

    let doorLatchY = 4.6;
    let flagPivotY = 5.2;

    if (currentModelo === "vintage") {
      metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x22252a,
        roughness: 0.52,
        metalness: 0.8,
      });
      backMaterial = new THREE.MeshStandardMaterial({
        color: 0x181a1e,
        roughness: 0.65,
        metalness: 0.75,
      });
      doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2c2f35,
        roughness: 0.48,
        metalness: 0.78,
      });
      brassMaterial = new THREE.MeshStandardMaterial({
        color: 0xc99c42,
        metalness: 0.92,
        roughness: 0.28,
      });
      flagArmMaterial = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.9 });
      flagBladeMaterial = new THREE.MeshStandardMaterial({
        color: 0xd9a84e,
        roughness: 0.32,
        metalness: 0.78,
      });
      postMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1c20,
        roughness: 0.7,
        metalness: 0.6,
      });

      doorLatchY = 5.2;
      flagPivotY = 6.0;

    } else if (currentModelo === "moderno") {
      metalMaterial = new THREE.MeshStandardMaterial({
        color: 0xf2c2c7,
        roughness: 0.16,
        metalness: 0.16,
      });
      backMaterial = new THREE.MeshStandardMaterial({
        color: 0xe2b2b7,
        roughness: 0.25,
        metalness: 0.12,
      });
      doorMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.14,
        metalness: 0.1,
      });
      brassMaterial = new THREE.MeshStandardMaterial({
        color: 0xebbe73,
        metalness: 0.9,
        roughness: 0.18,
      });
      flagArmMaterial = new THREE.MeshStandardMaterial({ color: 0xff99a8, metalness: 0.55 });
      flagBladeMaterial = new THREE.MeshStandardMaterial({
        color: 0xef3054,
        roughness: 0.16,
        metalness: 0.18,
      });
      postMaterial = new THREE.MeshStandardMaterial({
        color: 0xf9fafb,
        roughness: 0.22,
        metalness: 0.22,
      });

      doorLatchY = 4.8;
      flagPivotY = 5.5;

    } else {
      metalMaterial = new THREE.MeshStandardMaterial({
        color: 0x5482b3,
        roughness: 0.24,
        metalness: 0.4,
      });
      backMaterial = new THREE.MeshStandardMaterial({
        color: 0x436c96,
        roughness: 0.35,
        metalness: 0.35,
      });
      doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x5c8bc2,
        roughness: 0.22,
        metalness: 0.38,
      });
      brassMaterial = new THREE.MeshStandardMaterial({
        color: 0xf0c268,
        metalness: 0.92,
        roughness: 0.18,
      });
      flagArmMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.82 });
      flagBladeMaterial = new THREE.MeshStandardMaterial({
        color: 0xeb2f46,
        roughness: 0.26,
        metalness: 0.18,
      });
      postMaterial = new THREE.MeshStandardMaterial({
        color: 0x46301e,
        roughness: 0.85,
        metalness: 0.05,
      });

      doorLatchY = 4.6;
      flagPivotY = 5.2;
    }

    // -------------------------------------------------------------------------
    // ENSAMBLAJE TRIDIMENSIONAL SÓLIDO (6 PANELS CONTINUOS SIN VACÍOS)
    // -------------------------------------------------------------------------
    const mailboxBodyGroup = new THREE.Group();

    // 1. Placa de Suelo Sólida
    const floorGeom = new THREE.BoxGeometry(15, 0.8, 22);
    const floorMesh = new THREE.Mesh(floorGeom, metalMaterial);
    floorMesh.position.set(0, 0.4, 0);
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    mailboxBodyGroup.add(floorMesh);

    // 2. Pared Lateral Izquierda Maciza
    const leftWallGeom = new THREE.BoxGeometry(0.8, 6.5, 22);
    const leftWallMesh = new THREE.Mesh(leftWallGeom, metalMaterial);
    leftWallMesh.position.set(-7.1, 3.65, 0);
    leftWallMesh.castShadow = true;
    leftWallMesh.receiveShadow = true;
    mailboxBodyGroup.add(leftWallMesh);

    // 3. Pared Lateral Derecha Maciza
    const rightWallGeom = new THREE.BoxGeometry(0.8, 6.5, 22);
    const rightWallMesh = new THREE.Mesh(rightWallGeom, metalMaterial);
    rightWallMesh.position.set(7.1, 3.65, 0);
    rightWallMesh.castShadow = true;
    rightWallMesh.receiveShadow = true;
    mailboxBodyGroup.add(rightWallMesh);

    // 4. Bóveda de Techo Cilíndrica Maciza
    const roofOuterGeom = new THREE.CylinderGeometry(7.5, 7.5, 22, 32, 1, false, 0, Math.PI);
    roofOuterGeom.rotateZ(-Math.PI / 2);
    roofOuterGeom.rotateY(Math.PI / 2);
    const roofOuterMesh = new THREE.Mesh(roofOuterGeom, metalMaterial);
    roofOuterMesh.position.set(0, 6.9, 0);
    roofOuterMesh.castShadow = true;
    roofOuterMesh.receiveShadow = true;
    mailboxBodyGroup.add(roofOuterMesh);

    // 5. Pared Trasera Ciega Maciza
    const backPlateGeom = new THREE.BoxGeometry(14.8, 11, 0.8);
    const backPlateMesh = new THREE.Mesh(backPlateGeom, backMaterial);
    backPlateMesh.position.set(0, 5.5, -11);
    backPlateMesh.castShadow = true;
    mailboxBodyGroup.add(backPlateMesh);

    // 6. Marco Frontal Embellecedor Redondeado
    const topFrameGeom = new THREE.BoxGeometry(15.4, 0.8, 0.8);
    const topFrameMesh = new THREE.Mesh(topFrameGeom, brassMaterial);
    topFrameMesh.position.set(0, 10.2, 11.0);
    mailboxBodyGroup.add(topFrameMesh);

    const leftFrameGeom = new THREE.BoxGeometry(0.8, 10.2, 0.8);
    const leftFrameMesh = new THREE.Mesh(leftFrameGeom, brassMaterial);
    leftFrameMesh.position.set(-7.3, 5.1, 11.0);
    mailboxBodyGroup.add(leftFrameMesh);

    const rightFrameGeom = new THREE.BoxGeometry(0.8, 10.2, 0.8);
    const rightFrameMesh = new THREE.Mesh(rightFrameGeom, brassMaterial);
    rightFrameMesh.position.set(7.3, 5.1, 11.0);
    mailboxBodyGroup.add(rightFrameMesh);

    mailboxGroup.add(mailboxBodyGroup);

    // Ranura superior para modelo moderno
    if (currentModelo === "moderno") {
      const letterSlot = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.38, 1.5),
        brassMaterial
      );
      letterSlot.position.set(0, 10.4, 0);
      letterSlot.castShadow = true;
      mailboxGroup.add(letterSlot);
    }

    // Remaches de bronce ornamentales en los 8 vértices
    const rivetMeshes: THREE.Mesh[] = [];
    const rivetGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12);
    rivetGeom.rotateX(Math.PI / 2);
    for (let x = -6.8; x <= 6.8; x += 2.7) {
      const rivet1 = new THREE.Mesh(rivetGeom, brassMaterial);
      rivet1.position.set(x, 0.8, 11.4);
      mailboxGroup.add(rivet1);
      rivetMeshes.push(rivet1);

      const rivet2 = new THREE.Mesh(rivetGeom, brassMaterial);
      rivet2.position.set(x, 6.2, 11.4);
      mailboxGroup.add(rivet2);
      rivetMeshes.push(rivet2);
    }

    // Suelo interior de correspondencia
    const shelfGeom = new THREE.BoxGeometry(13.8, 0.3, 21.6);
    const shelfMesh = new THREE.Mesh(
      shelfGeom,
      new THREE.MeshStandardMaterial({
        color: currentModelo === "vintage" ? 0x111317 : currentModelo === "moderno" ? 0xd4a5a5 : 0x1d3045,
        roughness: 0.7,
      })
    );
    shelfMesh.position.set(0, 0.45, 0);
    mailboxGroup.add(shelfMesh);

    // =========================================================================
    // POSTE INFERIOR CON ESCUADRA DE SOPORTE Y SOMBRA AMBIENTAL
    // =========================================================================
    const postGroup = new THREE.Group();
    postGroup.position.set(0, -6.5, 0);

    const postGeom = new THREE.CylinderGeometry(
      currentModelo === "vintage" ? 0.95 : currentModelo === "moderno" ? 0.75 : 0.85,
      currentModelo === "vintage" ? 1.2 : currentModelo === "moderno" ? 0.75 : 1.0,
      13,
      24
    );
    const postMesh = new THREE.Mesh(postGeom, postMaterial);
    postMesh.position.set(0, -0.5, 0);
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;
    postGroup.add(postMesh);

    const bracketGeom = new THREE.BoxGeometry(11, 0.6, 16);
    const bracketMesh = new THREE.Mesh(bracketGeom, brassMaterial);
    bracketMesh.position.set(0, 5.2, 0);
    bracketMesh.castShadow = true;
    postGroup.add(bracketMesh);

    mailboxGroup.add(postGroup);

    // Sombra radial en el suelo
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext("2d");
    if (sCtx) {
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
      grad.addColorStop(0.5, "rgba(0, 0, 0, 0.28)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.85,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.set(0, -12.6, 0);
    mailboxGroup.add(shadowPlane);

    // =========================================================================
    // PUERTA FRONTAL BASCULANTE MACIZA CON BISAGRA ARTICULADA (Z = +11)
    // =========================================================================
    const doorPivot = new THREE.Group();
    doorPivot.position.set(0, 0.1, 11.05);
    mailboxGroup.add(doorPivot);

    const doorGeometry = new THREE.BoxGeometry(13.8, 10.4, 0.55);
    const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
    doorMesh.position.set(0, 5.2, 0);
    doorPivot.add(doorMesh);

    // Bisagras de latón dorado macizas en la base
    const hingeGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.4, 12);
    hingeGeom.rotateZ(Math.PI / 2);

    const leftHinge = new THREE.Mesh(hingeGeom, brassMaterial);
    leftHinge.position.set(-5.5, 0.15, 0.3);
    doorPivot.add(leftHinge);

    const rightHinge = new THREE.Mesh(hingeGeom, brassMaterial);
    rightHinge.position.set(5.5, 0.15, 0.3);
    doorPivot.add(rightHinge);

    // Cerrojo superior de la puerta
    const latchPivot = new THREE.Group();
    latchPivot.position.set(0, doorLatchY, 0.55);
    doorPivot.add(latchPivot);

    const latchGeom = new THREE.TorusGeometry(0.9, 0.22, 12, 24);
    const latchMesh = new THREE.Mesh(latchGeom, brassMaterial);
    latchPivot.add(latchMesh);

    // Llave de bronce animada 3D para el modelo vintage
    const keyPivot = new THREE.Group();
    let keyStemGeom: THREE.CylinderGeometry | null = null;
    let keyRingGeom: THREE.TorusGeometry | null = null;
    if (currentModelo === "vintage") {
      keyPivot.position.set(0, 4.2, 0.85);

      keyStemGeom = new THREE.CylinderGeometry(0.12, 0.12, 1.6, 12);
      keyStemGeom.rotateX(Math.PI / 2);
      const keyStem = new THREE.Mesh(keyStemGeom, brassMaterial);
      keyPivot.add(keyStem);

      keyRingGeom = new THREE.TorusGeometry(0.55, 0.14, 12, 18);
      const keyRing = new THREE.Mesh(keyRingGeom, brassMaterial);
      keyRing.position.set(0, 0, 0.8);
      keyPivot.add(keyRing);

      doorPivot.add(keyPivot);
    }

    // =========================================================================
    // SOBRES / PERGAMINOS 3D WEBGL INTERACTIVOS Y ARTICULADOS
    // =========================================================================
    const envGroup = new THREE.Group();
    envGroup.position.set(0, 2.8, 2);

    let envBodyGeom: THREE.BufferGeometry;
    let envBodyMat: THREE.MeshStandardMaterial;
    let flapPivot: THREE.Group | null = null;
    let flapGeom: THREE.BufferGeometry | null = null;
    let scrollMesh: THREE.Mesh | null = null;
    let ribbonMesh: THREE.Mesh | null = null;
    let glassFrontMesh: THREE.Mesh | null = null;
    let heartSealPivot: THREE.Group | null = null;

    if (currentModelo === "vintage") {
      envBodyGeom = new THREE.CylinderGeometry(1.2, 1.2, 7.5, 24);
      envBodyGeom.rotateZ(Math.PI / 2);
      envBodyMat = new THREE.MeshStandardMaterial({
        color: 0xf4ead3,
        roughness: 0.5,
        metalness: 0.05,
      });
      scrollMesh = new THREE.Mesh(envBodyGeom, envBodyMat);
      envGroup.add(scrollMesh);

      const ribbonGeom = new THREE.TorusGeometry(1.28, 0.16, 12, 24);
      ribbonGeom.rotateY(Math.PI / 2);
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: 0xc4384b,
        roughness: 0.25,
        metalness: 0.3,
      });
      ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
      envGroup.add(ribbonMesh);

    } else if (currentModelo === "moderno") {
      envBodyGeom = new THREE.BoxGeometry(6.8, 4.4, 0.25);
      envBodyMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
        metalness: 0.1,
      });
      const glassBase = new THREE.Mesh(envBodyGeom, envBodyMat);
      envGroup.add(glassBase);

      const glassFrontGeom = new THREE.BoxGeometry(6.6, 4.2, 0.1);
      const glassFrontMat = new THREE.MeshStandardMaterial({
        color: 0xff4d6d,
        transparent: true,
        opacity: 0.45,
        roughness: 0.05,
      });
      glassFrontMesh = new THREE.Mesh(glassFrontGeom, glassFrontMat);
      glassFrontMesh.position.set(0, 0, 0.15);
      envGroup.add(glassFrontMesh);

      heartSealPivot = new THREE.Group();
      heartSealPivot.position.set(0, 0, 0.3);
      const heartShape3D = new THREE.Shape();
      heartShape3D.moveTo(0, 0.3);
      heartShape3D.bezierCurveTo(0, 0.3, -0.5, 0.8, -0.5, 1.3);
      heartShape3D.bezierCurveTo(-0.5, 1.8, 0, 2.2, 0, 2.6);
      heartShape3D.bezierCurveTo(0, 2.2, 0.5, 1.8, 0.5, 1.3);
      heartShape3D.bezierCurveTo(0.5, 0.8, 0, 0.3, 0, 0.3);
      heartShape3D.closePath();

      const heartGeom3D = new THREE.ExtrudeGeometry(heartShape3D, {
        depth: 0.15,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.04,
        bevelThickness: 0.04,
      });
      heartGeom3D.center();
      const heartMat3D = new THREE.MeshStandardMaterial({
        color: 0xff1744,
        roughness: 0.15,
        metalness: 0.3,
      });
      const heartMesh3D = new THREE.Mesh(heartGeom3D, heartMat3D);
      heartSealPivot.add(heartMesh3D);
      envGroup.add(heartSealPivot);

    } else {
      envBodyGeom = new THREE.BoxGeometry(6.8, 4.4, 0.32);
      envBodyMat = new THREE.MeshStandardMaterial({
        color: 0xfaf7f0,
        roughness: 0.35,
        metalness: 0.05,
      });
      const envBody = new THREE.Mesh(envBodyGeom, envBodyMat);
      envGroup.add(envBody);

      flapPivot = new THREE.Group();
      flapPivot.position.set(0, 2.2, 0.17);

      const flapShape = new THREE.Shape();
      flapShape.moveTo(-3.4, 0);
      flapShape.lineTo(0, -2.4);
      flapShape.lineTo(3.4, 0);
      flapShape.closePath();

      flapGeom = new THREE.ExtrudeGeometry(flapShape, {
        depth: 0.08,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.02,
        bevelThickness: 0.02,
      });
      const flapMesh = new THREE.Mesh(
        flapGeom,
        new THREE.MeshStandardMaterial({
          color: 0xf3eee2,
          roughness: 0.38,
        })
      );
      flapPivot.add(flapMesh);
      envGroup.add(flapPivot);

      const sealGeom = new THREE.CylinderGeometry(0.72, 0.72, 0.18, 24);
      sealGeom.rotateX(Math.PI / 2);
      const sealMat = new THREE.MeshStandardMaterial({
        color: 0xc4384b,
        roughness: 0.25,
        metalness: 0.2,
      });
      const sealMesh = new THREE.Mesh(sealGeom, sealMat);
      sealMesh.position.set(0, -1.2, 0.12);
      flapPivot.add(sealMesh);
    }

    mailboxGroup.add(envGroup);

    // =========================================================================
    // BANDERÍN POSTAL ARTICULADO EN EL COSTADO
    // =========================================================================
    const flagPivot = new THREE.Group();
    flagPivot.position.set(7.62, flagPivotY, 4.5);
    mailboxGroup.add(flagPivot);

    const flagArmGeom = new THREE.CylinderGeometry(0.14, 0.14, 6.2, 10);
    flagArmGeom.translate(0, 3.1, 0);
    const flagArm = new THREE.Mesh(flagArmGeom, flagArmMaterial);
    flagPivot.add(flagArm);

    let flagBlade: THREE.Mesh;
    let flagBladeGeom: THREE.BufferGeometry;

    if (currentModelo === "moderno") {
      const heartShape = new THREE.Shape();
      heartShape.moveTo(0, 0.5);
      heartShape.bezierCurveTo(0, 0.5, -0.8, 1.4, -0.8, 2.2);
      heartShape.bezierCurveTo(-0.8, 3.0, 0, 3.6, 0, 4.2);
      heartShape.bezierCurveTo(0, 3.6, 0.8, 3.0, 0.8, 2.2);
      heartShape.bezierCurveTo(0.8, 1.4, 0, 0.5, 0, 0.5);
      heartShape.closePath();

      flagBladeGeom = new THREE.ExtrudeGeometry(heartShape, {
        depth: 0.2,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.05,
        bevelThickness: 0.05,
      });
      flagBladeGeom.translate(0, 4.2, 0);
      flagBlade = new THREE.Mesh(flagBladeGeom, flagBladeMaterial);
    } else {
      flagBladeGeom = new THREE.BoxGeometry(2.4, 3.6, 0.15);
      flagBladeGeom.translate(1.2, 4.5, 0);
      flagBlade = new THREE.Mesh(flagBladeGeom, flagBladeMaterial);
    }
    flagPivot.add(flagBlade);

    // =========================================================================
    // TEXTURA Y DECAL DE PINTURA EN EL COSTADO DEL BUZÓN ("Samuel & Diana")
    // =========================================================================
    const paintCanvas = document.createElement("canvas");
    paintCanvas.width = 2048;
    paintCanvas.height = 1024;
    const pCtx = paintCanvas.getContext("2d");

    const renderPaintCanvas = () => {
      if (!pCtx) return;
      pCtx.clearRect(0, 0, 2048, 1024);

      const caveatFamily = '"Caveat", "Dancing Script", "Brush Script MT", cursive, sans-serif';
      const interFamily = '"Inter", system-ui, -apple-system, sans-serif';
      const monoFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';

      pCtx.textAlign = "center";
      pCtx.textBaseline = "middle";

      pCtx.font = `700 36px ${interFamily}`;
      try {
        (pCtx as unknown as { letterSpacing: string }).letterSpacing = "8px";
      } catch {}
      pCtx.fillStyle = "rgba(225, 242, 255, 0.92)";
      pCtx.fillText("★  BUZÓN FAMILIAR  ★", 1024, 130);

      pCtx.font = `bold 240px ${caveatFamily}`;
      try {
        (pCtx as unknown as { letterSpacing: string }).letterSpacing = "2px";
      } catch {}

      pCtx.fillStyle = "rgba(8, 20, 38, 0.88)";
      pCtx.fillText(coupleNamesRef.current, 1024 + 5, 335 + 6);

      pCtx.fillStyle = "rgba(15, 35, 62, 0.45)";
      pCtx.fillText(coupleNamesRef.current, 1024 + 2, 335 + 3);

      pCtx.fillStyle = "#FFFFFF";
      pCtx.fillText(coupleNamesRef.current, 1024, 335);

      pCtx.strokeStyle = "rgba(255, 255, 255, 0.75)";
      pCtx.lineWidth = 2.5;
      pCtx.strokeText(coupleNamesRef.current, 1024, 335);

      pCtx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      pCtx.lineWidth = 8;
      pCtx.lineCap = "round";
      pCtx.beginPath();
      pCtx.moveTo(260, 465);
      pCtx.bezierCurveTo(680, 495, 1360, 435, 1788, 465);
      pCtx.stroke();

      pCtx.font = `bold 44px ${interFamily}`;
      try {
        (pCtx as unknown as { letterSpacing: string }).letterSpacing = "12px";
      } catch {}
      pCtx.fillStyle = "rgba(8, 20, 38, 0.75)";
      pCtx.fillText("NUESTROS VIAJES · BUZÓN DE AVENTURAS", 1024 + 2, 545 + 3);
      pCtx.fillStyle = "rgba(235, 245, 255, 0.98)";
      pCtx.fillText("NUESTROS VIAJES · BUZÓN DE AVENTURAS", 1024, 545);

      pCtx.font = `600 24px ${monoFamily}`;
      try {
        (pCtx as unknown as { letterSpacing: string }).letterSpacing = "6px";
      } catch {}
      pCtx.fillStyle = "rgba(195, 225, 252, 0.85)";
      pCtx.fillText("EST. 2026 · CORRESPONDENCIA PRIVADA · AMOR Y RECUERDOS", 1024, 630);
    };

    renderPaintCanvas();

    const paintTexture = new THREE.CanvasTexture(paintCanvas);
    paintTexture.anisotropy = 16;
    paintTexture.minFilter = THREE.LinearMipmapLinearFilter;
    paintTexture.magFilter = THREE.LinearFilter;
    paintTexture.generateMipmaps = true;

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        renderPaintCanvas();
        paintTexture.needsUpdate = true;
      });
    }

    const paintGeom = createMailboxDecalGeometry(20.4, 7.54, 0, Math.PI * 0.40, 1.2);
    const paintPlate = new THREE.Mesh(
      paintGeom,
      new THREE.MeshStandardMaterial({
        map: paintTexture,
        transparent: true,
        roughness: 0.32,
        metalness: 0.22,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      })
    );
    mailboxGroup.add(paintPlate);

    // =========================================================================
    // ETIQUETA ADHESIVA DE LOGIN PEGADA AL COSTADO (CSS3DObject en X = +7.58)
    // =========================================================================
    const labelDom = labelDomRef.current;
    let cssObject: CSS3DObject | null = null;
    if (labelDom) {
      cssObject = new CSS3DObject(labelDom);
      const isMobile = width < 768;
      const stickerScale = isMobile ? 0.035 : 0.038;
      cssObject.position.set(7.58, 0.8, 0);
      cssObject.rotation.y = Math.PI / 2;
      cssObject.scale.set(stickerScale, stickerScale, stickerScale);
      mailboxGroup.add(cssObject);
    }

    // =========================================================================
    // DETECCIÓN RAYCASTER WEBGL PARA CLICS EN OBJETOS 3D (PUERTA / SOBRE 3D)
    // =========================================================================
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mousePointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mousePointerRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        if (stage === "front_closed") {
          handleDoorClick();
        } else if (stage === "letters_floating" && pendingCitas.length > 0) {
          const citaTarget = pendingCitas[activeEnvelopeIndex] || pendingCitas[0];
          if (citaTarget) {
            handleEnvelopeClick(citaTarget);
          }
        }
      }
    };

    container.addEventListener("click", handleCanvasClick);

    // =========================================================================
    // BUCLE DE ANIMACIÓN CONTINUA (Física suave sin saltos)
    // =========================================================================
    let animId: number;
    let currDoorRotX = 0;
    let currDoorZ = 11.05;
    let currKeyRotZ = 0;
    let currLatchRotX = 0;
    let currFlapRotX = 0;
    let currScrollUnroll = 0;
    let currGlassSlideX = 0;
    let currLight = 0;
    let currPosX = animStateRef.current.targetPosX;
    let currScale = 1;
    const clock = new THREE.Clock();

    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const s = animStateRef.current;
      const orb = orbitStateRef.current;

      // Suavizado de rotación orbital
      orb.rotY += (orb.targetRotY - orb.rotY) * Math.min(delta * 6, 1);
      orb.rotX += (orb.targetRotX - orb.rotX) * Math.min(delta * 6, 1);

      // Suavizado de targets de estado
      currDoorRotX += (s.targetDoorRotX - currDoorRotX) * Math.min(delta * 6.5, 1);
      currDoorZ += (s.targetDoorZ - currDoorZ) * Math.min(delta * 6, 1);
      currKeyRotZ += (s.targetKeyRotZ - currKeyRotZ) * Math.min(delta * 7, 1);
      currLatchRotX += (s.targetLatchRotX - currLatchRotX) * Math.min(delta * 7, 1);
      currFlapRotX += (s.targetFlapRotX - currFlapRotX) * Math.min(delta * 5.5, 1);
      currScrollUnroll += (s.targetScrollUnroll - currScrollUnroll) * Math.min(delta * 5.5, 1);
      currGlassSlideX += (s.targetGlassSlideX - currGlassSlideX) * Math.min(delta * 5.5, 1);
      currLight += (s.targetLightIntensity - currLight) * Math.min(delta * 7, 1);
      currPosX += (s.targetPosX - currPosX) * Math.min(delta * 5.5, 1);
      currScale += (s.targetScale - currScale) * Math.min(delta * 5, 1);

      // Aplicar transformaciones al Buzón 3D
      mailboxGroup.rotation.y = orb.rotY;
      mailboxGroup.rotation.x = orb.rotX;
      mailboxGroup.position.x = currPosX;
      mailboxGroup.scale.set(currScale, currScale, currScale);

      // Cinemática mecánica de apertura de la puerta con rebote de masa física
      let doorAngle = currDoorRotX;
      if (currDoorRotX < -Math.PI * 0.44) {
        const bounce = Math.sin(elapsed * 14) * 0.025 * Math.exp(-Math.abs(currDoorRotX + Math.PI * 0.48) * 4);
        doorAngle += bounce;
      }
      doorPivot.rotation.x = doorAngle;
      doorPivot.position.z = currDoorZ;

      latchPivot.rotation.x = currLatchRotX;
      if (keyPivot) keyPivot.rotation.z = currKeyRotZ;
      interiorLight.intensity = currLight;

      // Cinemática de apertura de sobres / pergaminos 3D
      if (flapPivot) flapPivot.rotation.x = currFlapRotX;
      if (scrollMesh) {
        scrollMesh.scale.x = 1 + currScrollUnroll * 0.45;
        if (ribbonMesh) ribbonMesh.position.y = currScrollUnroll * 4.2;
      }
      if (glassFrontMesh) glassFrontMesh.position.x = currGlassSlideX;
      if (heartSealPivot) heartSealPivot.position.z = 0.3 + Math.sin(elapsed * 3) * 0.15;

      // Flotación del sobre 3D emergiendo desde la cavidad
      if (stage === "door_opening" || stage === "letters_floating") {
        envGroup.visible = true;
        envGroup.position.z += (13.8 - envGroup.position.z) * Math.min(delta * 3.5, 1);
        envGroup.position.y = 2.8 + Math.sin(elapsed * 2.2) * 0.35;
        envGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.06;
      } else {
        envGroup.position.z += (2.0 - envGroup.position.z) * Math.min(delta * 6, 1);
        if (envGroup.position.z < 2.5) envGroup.visible = false;
      }

      if (cssObject) {
        cssObject.visible = s.showLabel;
      }

      // Animación suave del banderín cuando hay cartas pendientes
      if (s.hasUnread) {
        flagPivot.rotation.z = Math.sin(elapsed * 2.5) * 0.05;
      } else {
        flagPivot.rotation.z = 1.45;
      }

      webglRenderer.render(scene, camera);
      cssRenderer.render(scene, camera);
    };

    animate();

    // Manejo de visibilidad
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animId);
      } else {
        if (!isRunning) {
          isRunning = true;
          clock.getDelta();
          animate();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Manejo de redimensionado de ventana
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;

      const isMobileNow = width < 768;
      camera.position.z = isMobileNow ? 44 : 38;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      webglRenderer.setSize(width, height);
      cssRenderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("click", handleCanvasClick);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      isRunning = false;
      cancelAnimationFrame(animId);

      if (container.contains(webglRenderer.domElement)) {
        container.removeChild(webglRenderer.domElement);
      }
      if (container.contains(cssRenderer.domElement)) {
        container.removeChild(cssRenderer.domElement);
      }

      floorGeom.dispose();
      leftWallGeom.dispose();
      rightWallGeom.dispose();
      roofOuterGeom.dispose();
      backPlateGeom.dispose();
      topFrameGeom.dispose();
      leftFrameGeom.dispose();
      rightFrameGeom.dispose();
      doorGeometry.dispose();
      hingeGeom.dispose();
      latchGeom.dispose();
      flagArmGeom.dispose();
      flagBladeGeom.dispose();
      postGeom.dispose();
      bracketGeom.dispose();
      shadowPlane.geometry.dispose();
      metalMaterial.dispose();
      backMaterial.dispose();
      doorMaterial.dispose();
      brassMaterial.dispose();
      flagArmMaterial.dispose();
      flagBladeMaterial.dispose();
      postMaterial.dispose();
      shelfGeom.dispose();
      envBodyGeom.dispose();
      envBodyMat.dispose();
      if (flapGeom) flapGeom.dispose();
      if (rivetGeom) rivetGeom.dispose();
      if (keyStemGeom) keyStemGeom.dispose();
      if (keyRingGeom) keyRingGeom.dispose();
      paintGeom.dispose();
      paintTexture.dispose();
      shadowTex.dispose();
      webglRenderer.dispose();
    };
  }, [modeloBuzonState, pendingCitas, activeEnvelopeIndex, stage]);

  return (
    <>
      {/* Botón flotante miniatura cuando está minimizado en el dashboard */}
      {!isLoginScreen && stage === "minimized_widget" && (
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
                  {coupleNames}
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
      )}

      {/* Contenedor del Buzón 3D (Lienzo en vivo montado persistentemente con arrastre orbital 360°) */}
      <div
        className={
          isLoginScreen
            ? "relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
            : `fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
                stage === "docking" || stage === "minimized_widget"
                  ? "bg-transparent backdrop-blur-none pointer-events-none opacity-0"
                  : "bg-[#101D2B]/75 backdrop-blur-md opacity-100 pointer-events-auto"
              }`
        }
      >
        {/* Botón superior de cerrar hacia el dashboard si no es login */}
        {!isLoginScreen && stage !== "lateral_login" && stage !== "minimized_widget" && stage !== "docking" && (
          <button
            type="button"
            onClick={() => {
              setStage("docking");
              setTimeout(() => {
                setStage("minimized_widget");
                onCloseToDashboard?.();
              }, 600);
            }}
            className="fixed top-5 right-5 z-50 p-2.5 rounded-full bg-white/90 hover:bg-white text-ink-soft hover:text-ink shadow-md transition-transform hover:scale-105 cursor-pointer border border-sky-100"
            title="Minimizar buzón e ir al tablero"
          >
            <X size={18} />
          </button>
        )}

        {/* Botón de reseteo de cámara 3D si se rotó el buzón */}
        {stage !== "lateral_login" && stage !== "minimized_widget" && (
          <button
            type="button"
            onClick={() => {
              orbitStateRef.current.targetRotX = 0;
              orbitStateRef.current.targetRotY = animStateRef.current.stageBaseRotY;
            }}
            className="fixed bottom-5 left-5 z-40 p-2 rounded-full bg-white/80 hover:bg-white text-sky-900 text-xs font-bold shadow-md border border-sky-100 flex items-center gap-1.5 backdrop-blur-sm cursor-pointer transition-all hover:scale-105"
            title="Restablecer vista frontal de cámara 3D"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Centrar Vista 3D</span>
          </button>
        )}

        {/* LIENZO 3D THREE.JS (Contenedor de WebGL y CSS3D con seguimiento orbital drag) */}
        <div
          ref={mountRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative w-full ${
            isLoginScreen ? "h-screen min-h-[620px]" : "h-full min-h-[500px]"
          } flex items-center justify-center select-none cursor-grab active:cursor-grabbing`}
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
          className="w-[340px] max-w-[92vw] bg-gradient-to-b from-[#FAF8EE] to-[#F1E9D2] rounded-xl p-3.5 text-center border-2 border-dashed border-[#D2C5A7] shadow-[0_10px_25px_rgba(10,25,50,0.35)] select-text"
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
            <form onSubmit={handleLoginSubmit} className="space-y-2.5 text-left">
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
                    className="w-full py-2 px-2.5 pl-8 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/95 text-ink focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                  />
                  <Mail
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-700 opacity-75"
                  />
                </div>
              </div>

              {/* Campo Contraseña con Botón de Ojo */}
              <div>
                <label className="block text-[9.5px] font-bold uppercase tracking-wider text-ink-soft mb-0.5">
                  Contraseña Secreta
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-2 px-2.5 pl-8 pr-9 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/95 text-ink focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                  />
                  <Lock
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-700 opacity-75"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors p-0.5 cursor-pointer"
                    title={showLoginPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
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
              {/* Selección de tipo de perfil a crear (Novio / Novia) */}
              <div>
                <label className="block text-[9.5px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Tipo de perfil a crear
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole("novio")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      regRole === "novio"
                        ? "border-sky-500 bg-sky-100 text-sky-950 shadow-xs ring-1 ring-sky-400 font-extrabold"
                        : "border-[#D9CEB5] bg-white/70 text-ink-soft hover:bg-sky-50/50"
                    }`}
                  >
                    <User size={12} className="text-sky-700" />
                    <span>Novio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole("novia")}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      regRole === "novia"
                        ? "border-blush-400 bg-blush-100 text-blush-950 shadow-xs ring-1 ring-blush-300 font-extrabold"
                        : "border-[#D9CEB5] bg-white/70 text-ink-soft hover:bg-blush-50/50"
                    }`}
                  >
                    <Heart size={12} className="text-blush-500 fill-blush-400" />
                    <span>Novia</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-ink-soft mb-0.5">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="ej. Jorge, Sofía..."
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
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full py-1.5 px-2.5 pr-9 border border-[#D5C9AF] rounded-lg font-sans text-xs bg-white/90 text-ink focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors p-0.5 cursor-pointer"
                    title={showRegPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
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
          className="absolute bottom-10 z-40 flex flex-col items-center cursor-pointer select-none"
        >
          <div className="bg-white/95 text-sky-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg border border-sky-100 flex items-center gap-2 hover:scale-105 transition-transform">
            <Heart size={15} className="fill-blush-400 text-blush-400 animate-ping" />
            <span>Toca el buzón 3D o la puerta para abrirlo</span>
          </div>
        </motion.div>
      )}

      {/* Indicador táctil para interactuar con los sobres 3D en WebGL */}
      {stage === "letters_floating" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-10 z-40 flex flex-col items-center select-none pointer-events-none"
        >
          {pendingCitas.length > 0 ? (
            <div className="bg-white/95 text-sky-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg border border-sky-100 flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500 animate-bounce" />
              <span>Toca la carta 3D en el centro para desplegarla</span>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-sky-100 shadow-xl text-center max-w-sm pointer-events-auto">
              <Heart size={26} className="fill-sky-400 text-sky-500 mx-auto mb-2" />
              <h3 className="font-serif font-bold text-base text-ink">Buzón al día</h3>
              <p className="text-xs text-ink-soft mt-1">
                No tienes cartas pendientes por responder.
              </p>
              <button
                type="button"
                onClick={handleCloseExpandedLetter}
                className="mt-3 px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
              >
                Ir al Tablero Principal
              </button>
            </div>
          )}
        </motion.div>
      )}

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
    </>
  );
}
