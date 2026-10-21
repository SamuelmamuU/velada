import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { ICitaResponse, ModeloBuzon } from "@/types";
import { MailboxStage, MailboxModelParts, EnvelopeModelParts } from "./types";
import { createMailboxModel } from "./mailboxModel";
import { createEnvelopeModel } from "./envelopeModel";

interface MailboxSceneConfig {
  container: HTMLElement;
  labelDomElement: HTMLElement | null;
  initialStage: MailboxStage;
  modelo: ModeloBuzon;
  coupleNames: string;
  novioName: string;
  noviaName: string;
  pendingCitas: ICitaResponse[];
  activeEnvelopeIndex: number;
  onDoorClick: () => void;
  onEnvelopeClick: (cita: ICitaResponse) => void;
}

export class MailboxScene {
  private container: HTMLElement;
  private labelDomElement: HTMLElement | null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private webglRenderer: THREE.WebGLRenderer;
  private cssRenderer: CSS3DRenderer;
  private cssObject: CSS3DObject | null = null;

  private mailboxParts: MailboxModelParts;
  private envelopeParts: EnvelopeModelParts;

  private stage: MailboxStage;
  private modelo: ModeloBuzon;
  private coupleNames: string;
  private novioName: string;
  private noviaName: string;
  private pendingCitas: ICitaResponse[];
  private activeIndex: number;

  private onDoorClick: () => void;
  private onEnvelopeClick: (cita: ICitaResponse) => void;

  private animId: number = 0;
  private isDestroyed: boolean = false;
  private clock = new THREE.Clock();
  private resizeObserver: ResizeObserver | null = null;

  // Estado cinemático suave
  private orb = {
    isDragging: false,
    startX: 0,
    startY: 0,
    prevX: 0,
    prevY: 0,
    rotX: 0,
    rotY: -Math.PI * 0.5,
    targetRotX: 0,
    targetRotY: -Math.PI * 0.5,
  };

  private motion = {
    stageBaseRotY: -Math.PI * 0.5,
    currDoorRotX: 0,
    targetDoorRotX: 0,
    currLatchRotX: 0,
    targetLatchRotX: 0,
    currKeyRotZ: 0,
    targetKeyRotZ: 0,
    currFlapRotX: 0,
    targetFlapRotX: 0,
    currLightIntensity: 0,
    targetLightIntensity: 0,
    envelopeZ: 2.0,
    targetEnvelopeZ: 2.0,
    envelopeY: 2.5,
    scale: 1.0,
    targetScale: 1.0,
  };

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  constructor(config: MailboxSceneConfig) {
    this.container = config.container;
    this.labelDomElement = config.labelDomElement;
    this.stage = config.initialStage;
    this.modelo = config.modelo;
    this.coupleNames = config.coupleNames;
    this.novioName = config.novioName;
    this.noviaName = config.noviaName;
    this.pendingCitas = config.pendingCitas;
    this.activeIndex = config.activeEnvelopeIndex;
    this.onDoorClick = config.onDoorClick;
    this.onEnvelopeClick = config.onEnvelopeClick;

    // 1. Escena y Cámara con perspectiva adaptativa
    this.scene = new THREE.Scene();
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.updateCameraPlacement(width, height);

    // 2. Renderizador WebGL con límites de DPR para rendimiento móvil óptimo
    const isMobile = width < 768;
    const maxDpr = isMobile ? 1.5 : 2.0;

    this.webglRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.webglRenderer.setSize(width, height);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.webglRenderer.shadowMap.enabled = true;
    this.webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.webglRenderer.domElement.style.position = "absolute";
    this.webglRenderer.domElement.style.inset = "0";
    this.webglRenderer.domElement.style.width = "100%";
    this.webglRenderer.domElement.style.height = "100%";
    this.webglRenderer.domElement.style.pointerEvents = "none";
    this.container.appendChild(this.webglRenderer.domElement);

    // 3. Renderizador CSS3D para la etiqueta adhesiva lateral
    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(width, height);
    this.cssRenderer.domElement.style.position = "absolute";
    this.cssRenderer.domElement.style.inset = "0";
    this.cssRenderer.domElement.style.width = "100%";
    this.cssRenderer.domElement.style.height = "100%";
    this.cssRenderer.domElement.style.pointerEvents = "none";
    this.container.appendChild(this.cssRenderer.domElement);

    // 4. Luces fotorrealistas
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfffaed, 2.1);
    sun.position.set(20, 36, 26);
    sun.castShadow = true;
    sun.shadow.mapSize.width = isMobile ? 512 : 1024;
    sun.shadow.mapSize.height = isMobile ? 512 : 1024;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    const rim = new THREE.DirectionalLight(0x90caf9, 0.9);
    rim.position.set(-24, 16, -20);
    this.scene.add(rim);

    // 5. Instanciar Modelo del Buzón
    this.mailboxParts = createMailboxModel({
      modelo: this.modelo,
      coupleNames: this.coupleNames,
    });
    this.scene.add(this.mailboxParts.group);

    // 6. Instanciar Sobre 3D
    const currentCita = this.pendingCitas[this.activeIndex] || this.pendingCitas[0] || null;
    this.envelopeParts = createEnvelopeModel(currentCita, this.novioName, this.noviaName);
    this.envelopeParts.group.visible = false;
    this.mailboxParts.group.add(this.envelopeParts.group);

    // 7. Etiqueta Adhesiva Lateral CSS3D
    if (this.labelDomElement) {
      this.cssObject = new CSS3DObject(this.labelDomElement);
      const stickerScale = isMobile ? 0.034 : 0.038;
      // Colocada pegada en el costado derecho (+X)
      const posX = this.modelo === "vintage" ? 7.62 : 7.52;
      this.cssObject.position.set(posX, 0.8, 0);
      this.cssObject.rotation.y = Math.PI / 2;
      this.cssObject.scale.set(stickerScale, stickerScale, stickerScale);
      this.mailboxParts.group.add(this.cssObject);
    }

    // 8. Configurar Targets de Escena según Stage Inicial
    this.syncStageTargets();

    // 9. Event Listeners
    this.bindEvents();

    // 10. Bucle de Render
    this.startLoop();
  }

  private updateCameraPlacement(width: number, height: number) {
    const isMobile = width < 768;
    const aspect = width / height;

    this.camera.aspect = aspect;
    if (aspect < 0.85) {
      // Pantalla vertical alta (celulares): alejar suavemente para abarcar buzón y etiqueta lateral
      this.camera.position.set(0, 3.6, 44);
    } else if (aspect < 1.2) {
      // Tablets o pantallas cuadradas
      this.camera.position.set(0, 3.4, 40);
    } else {
      // Pantallas panorámicas desktop
      this.camera.position.set(0, 3.0, 36);
    }
    this.camera.lookAt(0, 2.2, 0);
    this.camera.updateProjectionMatrix();
  }

  public setStage(newStage: MailboxStage) {
    this.stage = newStage;
    this.syncStageTargets();
  }

  public setModelo(newModelo: ModeloBuzon) {
    if (this.modelo === newModelo) return;
    this.modelo = newModelo;

    // Eliminar buzón anterior
    this.scene.remove(this.mailboxParts.group);
    this.mailboxParts.dispose();

    // Crear nuevo buzón
    this.mailboxParts = createMailboxModel({
      modelo: this.modelo,
      coupleNames: this.coupleNames,
    });
    this.scene.add(this.mailboxParts.group);

    // Reasociar sobre y etiqueta al nuevo grupo
    this.mailboxParts.group.add(this.envelopeParts.group);
    if (this.cssObject) {
      const isMobile = (this.container.clientWidth || window.innerWidth) < 768;
      const stickerScale = isMobile ? 0.034 : 0.038;
      const posX = this.modelo === "vintage" ? 7.62 : 7.52;
      this.cssObject.position.set(posX, 0.8, 0);
      this.cssObject.scale.set(stickerScale, stickerScale, stickerScale);
      this.mailboxParts.group.add(this.cssObject);
    }

    this.syncStageTargets();
  }

  public updateCoupleNames(names: string) {
    this.coupleNames = names;
    this.mailboxParts.updateCoupleNames(names);
  }

  public updateCitas(citas: ICitaResponse[], activeIndex: number) {
    this.pendingCitas = citas;
    this.activeIndex = activeIndex;
    const current = citas[activeIndex] || citas[0] || null;
    this.envelopeParts.updateCita(current, this.novioName, this.noviaName);
  }

  public resetOrbit() {
    this.orb.targetRotX = 0;
    this.orb.targetRotY = this.motion.stageBaseRotY;
  }

  private syncStageTargets() {
    const s = this.motion;
    const hasUnread = this.pendingCitas.length > 0;

    switch (this.stage) {
      case "lateral_login":
        s.stageBaseRotY = -Math.PI * 0.5;
        this.orb.targetRotY = -Math.PI * 0.5;
        this.orb.targetRotX = 0;
        s.targetDoorRotX = 0;
        s.targetLatchRotX = 0;
        s.targetKeyRotZ = 0;
        s.targetFlapRotX = 0;
        s.targetLightIntensity = 0;
        s.targetEnvelopeZ = 2.0;
        s.targetScale = 1.0;
        if (this.cssObject) this.cssObject.visible = true;
        break;

      case "rotating_to_front":
        s.stageBaseRotY = 0;
        this.orb.targetRotY = 0;
        this.orb.targetRotX = 0;
        s.targetDoorRotX = 0;
        s.targetLatchRotX = 0;
        s.targetKeyRotZ = 0;
        s.targetFlapRotX = 0;
        s.targetLightIntensity = 0;
        s.targetEnvelopeZ = 2.0;
        s.targetScale = 0.95;
        if (this.cssObject) this.cssObject.visible = false;
        break;

      case "front_closed":
        s.stageBaseRotY = 0;
        this.orb.targetRotY = 0;
        this.orb.targetRotX = 0;
        s.targetDoorRotX = 0;
        s.targetLatchRotX = 0;
        s.targetKeyRotZ = 0;
        s.targetFlapRotX = 0;
        s.targetLightIntensity = 0;
        s.targetEnvelopeZ = 2.0;
        s.targetScale = 1.0;
        if (this.cssObject) this.cssObject.visible = false;
        break;

      case "door_opening":
      case "letters_floating":
        s.stageBaseRotY = 0;
        this.orb.targetRotY = 0;
        this.orb.targetRotX = 0.04;
        // La puerta cae HACIA AFUERA (+X rotation ~95°)
        s.targetDoorRotX = this.mailboxParts.doorTargetAngle;
        s.targetLatchRotX = -Math.PI * 0.25; // Se suelta el pestillo
        s.targetKeyRotZ = Math.PI * 0.5; // Gira la llave vintage
        s.targetFlapRotX = 0; // Sobre inicialmente CERRADO con sello
        s.targetLightIntensity = 3.8; // Luz cálida interior encendida
        s.targetEnvelopeZ = hasUnread ? 14.5 : 2.0;
        s.targetScale = 1.0;
        if (this.cssObject) this.cssObject.visible = false;
        break;

      case "letter_expanded":
        s.stageBaseRotY = -0.05;
        s.targetDoorRotX = this.mailboxParts.doorTargetAngle;
        s.targetFlapRotX = Math.PI * 0.95; // Solapa abierta al expandir
        s.targetLightIntensity = 2.0;
        s.targetScale = 0.85;
        break;

      case "docking":
      case "minimized_widget":
        s.stageBaseRotY = 0.15;
        this.orb.targetRotY = 0.15;
        this.orb.targetRotX = 0;
        s.targetDoorRotX = 0;
        s.targetLatchRotX = 0;
        s.targetKeyRotZ = 0;
        s.targetFlapRotX = 0;
        s.targetLightIntensity = 0;
        s.targetEnvelopeZ = 2.0;
        s.targetScale = 0.3;
        break;
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (this.stage === "letter_expanded") return;
    this.orb.isDragging = true;
    this.orb.startX = e.clientX;
    this.orb.startY = e.clientY;
    this.orb.prevX = e.clientX;
    this.orb.prevY = e.clientY;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.orb.isDragging) return;
    const dx = e.clientX - this.orb.prevX;
    const dy = e.clientY - this.orb.prevY;
    this.orb.prevX = e.clientX;
    this.orb.prevY = e.clientY;

    this.orb.targetRotY += dx * 0.007;
    this.orb.targetRotX = Math.max(-0.55, Math.min(0.55, this.orb.targetRotX + dy * 0.005));
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.orb.isDragging) return;
    this.orb.isDragging = false;

    // Distinción entre arrastre y TAP (distancia euclidiana menor a 7 px)
    const dist = Math.hypot(e.clientX - this.orb.startX, e.clientY - this.orb.startY);
    if (dist < 7) {
      this.handleTap(e.clientX, e.clientY);
    }
  };

  private handleTap(clientX: number, clientY: number) {
    const rect = this.container.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    if (this.stage === "front_closed") {
      const doorHits = this.raycaster.intersectObjects(this.mailboxParts.raycastTargets, true);
      if (doorHits.length > 0) {
        this.onDoorClick();
        return;
      }
    }

    if (this.stage === "letters_floating" && this.pendingCitas.length > 0) {
      const envHits = this.raycaster.intersectObjects(this.envelopeParts.raycastTargets, true);
      if (envHits.length > 0) {
        // Al tocar el sobre, abre la solapa triangular antes de expandir
        this.motion.targetFlapRotX = Math.PI * 0.95;
        const currentCita = this.pendingCitas[this.activeIndex] || this.pendingCitas[0];
        setTimeout(() => {
          this.onEnvelopeClick(currentCita);
        }, 350);
        return;
      }
    }
  }

  private handleResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.updateCameraPlacement(width, height);
    this.webglRenderer.setSize(width, height);
    this.cssRenderer.setSize(width, height);
  };

  private bindEvents() {
    this.container.addEventListener("pointerdown", this.handlePointerDown);
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);

    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.container);

    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  private handleVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.animId);
    } else {
      this.clock.getDelta();
      this.startLoop();
    }
  };

  private startLoop() {
    const animate = () => {
      if (this.isDestroyed) return;
      this.animId = requestAnimationFrame(animate);

      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      // 1. Suavizado de rotación orbital
      this.orb.rotY += (this.orb.targetRotY - this.orb.rotY) * Math.min(delta * 6.0, 1.0);
      this.orb.rotX += (this.orb.targetRotX - this.orb.rotX) * Math.min(delta * 6.0, 1.0);

      this.mailboxParts.group.rotation.y = this.orb.rotY;
      this.mailboxParts.group.rotation.x = this.orb.rotX;

      // 2. Cinemática de apertura de la puerta hacia afuera (+X)
      const m = this.motion;
      m.currDoorRotX += (m.targetDoorRotX - m.currDoorRotX) * Math.min(delta * 5.5, 1.0);
      m.currLatchRotX += (m.targetLatchRotX - m.currLatchRotX) * Math.min(delta * 7.0, 1.0);
      m.currKeyRotZ += (m.targetKeyRotZ - m.currKeyRotZ) * Math.min(delta * 6.0, 1.0);
      m.currFlapRotX += (m.targetFlapRotX - m.currFlapRotX) * Math.min(delta * 5.0, 1.0);
      m.currLightIntensity += (m.targetLightIntensity - m.currLightIntensity) * Math.min(delta * 6.5, 1.0);
      m.scale += (m.targetScale - m.scale) * Math.min(delta * 5.0, 1.0);

      // Rebote físico suave al llegar al tope horizontal
      let doorAngle = m.currDoorRotX;
      if (m.currDoorRotX > Math.PI * 0.48 && this.stage === "letters_floating") {
        const bounce = Math.sin(elapsed * 12.0) * 0.02 * Math.exp(-(m.currDoorRotX - Math.PI * 0.48) * 3);
        doorAngle += bounce;
      }

      this.mailboxParts.doorPivot.rotation.x = doorAngle;
      if (this.mailboxParts.latchPivot) {
        this.mailboxParts.latchPivot.rotation.x = m.currLatchRotX;
      }
      if (this.mailboxParts.keyPivot) {
        this.mailboxParts.keyPivot.rotation.z = m.currKeyRotZ;
      }
      this.mailboxParts.interiorLight.intensity = m.currLightIntensity;
      this.mailboxParts.group.scale.set(m.scale, m.scale, m.scale);

      // Banderín lateral oscila si hay cartas sin leer
      if (this.mailboxParts.flagPivot) {
        if (this.pendingCitas.length > 0) {
          this.mailboxParts.flagPivot.rotation.z = Math.sin(elapsed * 2.2) * 0.05;
        } else {
          this.mailboxParts.flagPivot.rotation.z = 1.45; // Abajo
        }
      }

      // 3. Cinemática del sobre 3D
      m.envelopeZ += (m.targetEnvelopeZ - m.envelopeZ) * Math.min(delta * 4.2, 1.0);
      if (m.envelopeZ > 3.0) {
        this.envelopeParts.group.visible = true;
        this.envelopeParts.group.position.z = m.envelopeZ;
        // Flotación sutil en reposo
        const bobbing = Math.sin(elapsed * 2.4) * 0.22;
        this.envelopeParts.group.position.y = 3.6 + bobbing;
        this.envelopeParts.group.rotation.z = Math.sin(elapsed * 1.6) * 0.04;
      } else {
        this.envelopeParts.group.visible = false;
        this.envelopeParts.group.position.z = 2.0;
      }

      // Solapa del sobre
      this.envelopeParts.flapPivot.rotation.x = m.currFlapRotX;

      // 4. Render
      this.webglRenderer.render(this.scene, this.camera);
      this.cssRenderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animId);

    this.container.removeEventListener("pointerdown", this.handlePointerDown);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
    document.removeEventListener("visibilitychange", this.handleVisibility);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.container.contains(this.webglRenderer.domElement)) {
      this.container.removeChild(this.webglRenderer.domElement);
    }
    if (this.container.contains(this.cssRenderer.domElement)) {
      this.container.removeChild(this.cssRenderer.domElement);
    }

    this.mailboxParts.dispose();
    this.envelopeParts.dispose();
    this.webglRenderer.dispose();
  }
}
