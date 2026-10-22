import * as THREE from "three";
import { ModeloBuzon } from "@/types";
import { createMailboxModel } from "@/components/mailbox/three/mailboxModel";
import { MailboxModelParts } from "@/components/mailbox/three/types";
import { createTumbleweedModel, TumbleweedModel } from "./TumbleweedModel";

export type WidgetMailboxState = "arriving" | "emptied" | "desert_tumbleweed";

interface WidgetSceneConfig {
  container: HTMLElement;
  modelo: ModeloBuzon;
  coupleNames: string;
  initialState?: WidgetMailboxState;
  onLetterArrived?: () => void;
}

export class MailboxWidgetScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private mailboxParts: MailboxModelParts;
  private tumbleweed: TumbleweedModel;

  private state: WidgetMailboxState;
  private modelo: ModeloBuzon;
  private coupleNames: string;
  private onLetterArrived?: () => void;

  private flyingLetterMesh: THREE.Mesh;
  private letterTrajectoryProgress: number = 0;
  private isLetterFlying: boolean = false;

  private sparkleParticles: THREE.Points;
  private sparklePositions: Float32Array;
  private sparkleCount: number = 45;

  private dustParticles: THREE.Points;
  private dustPositions: Float32Array;
  private dustCount: number = 30;

  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  private animId: number = 0;
  private isDestroyed: boolean = false;
  private clock = new THREE.Clock();
  private resizeObserver: ResizeObserver | null = null;

  // Interacción suave por inclinación táctil
  private tilt = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  };

  constructor(config: WidgetSceneConfig) {
    this.container = config.container;
    this.modelo = config.modelo;
    this.coupleNames = config.coupleNames;
    this.state = config.initialState || "arriving";
    this.onLetterArrived = config.onLetterArrived;

    const width = this.container.clientWidth || 320;
    const height = this.container.clientHeight || 240;

    // 1. Escena y Cámara con perspectiva encuadrada para widget
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 500);
    this.camera.position.set(0, 3.2, 34);
    this.camera.lookAt(0, 2.0, 0);

    // 2. Renderizador WebGL optimizado para widgets de bajo consumo
    const maxDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(maxDpr);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.inset = "0";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.container.appendChild(this.renderer.domElement);

    // 3. Luces
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaec, 2.2);
    this.sunLight.position.set(18, 30, 22);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 512;
    this.sunLight.shadow.mapSize.height = 512;
    this.scene.add(this.sunLight);

    // 4. Instanciar Buzón
    this.mailboxParts = createMailboxModel({
      modelo: this.modelo,
      coupleNames: this.coupleNames,
    });
    this.mailboxParts.group.scale.set(0.92, 0.92, 0.92);
    this.scene.add(this.mailboxParts.group);

    // 5. Instanciar Tumbleweed (Arbusto del Desierto)
    this.tumbleweed = createTumbleweedModel(1.85);
    this.tumbleweed.group.visible = this.state === "desert_tumbleweed";
    this.scene.add(this.tumbleweed.group);

    // 6. Carta Voladora para la Animación de Llegada
    const letterGeom = new THREE.BoxGeometry(4.2, 2.8, 0.15);
    const letterMat = new THREE.MeshStandardMaterial({
      color: 0xfdfbf7,
      roughness: 0.35,
      metalness: 0.05,
    });
    this.flyingLetterMesh = new THREE.Mesh(letterGeom, letterMat);
    this.flyingLetterMesh.castShadow = true;
    this.flyingLetterMesh.visible = false;
    this.scene.add(this.flyingLetterMesh);

    // Mini sello rojo en la carta voladora
    const sealGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.08, 16);
    sealGeom.rotateX(Math.PI / 2);
    const sealMesh = new THREE.Mesh(
      sealGeom,
      new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.3 })
    );
    sealMesh.position.set(0, 0, 0.09);
    this.flyingLetterMesh.add(sealMesh);

    // 7. Partículas de Destellos / Estela Mágica
    this.sparklePositions = new Float32Array(this.sparkleCount * 3);
    const sparkleGeom = new THREE.BufferGeometry();
    sparkleGeom.setAttribute("position", new THREE.BufferAttribute(this.sparklePositions, 3));

    const sparkleMat = new THREE.PointsMaterial({
      color: 0xfbbf24, // Dorado estelar
      size: 0.38,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.sparkleParticles = new THREE.Points(sparkleGeom, sparkleMat);
    this.sparkleParticles.visible = false;
    this.scene.add(this.sparkleParticles);

    // 8. Partículas de Polvo Desértico
    this.dustPositions = new Float32Array(this.dustCount * 3);
    for (let i = 0; i < this.dustCount; i++) {
      this.dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 30;
      this.dustPositions[i * 3 + 1] = -5.0 + Math.random() * 2.5;
      this.dustPositions[i * 3 + 2] = 10 + Math.random() * 6;
    }
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute("position", new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xd4a373, // Polvo marrón cálido
      size: 0.28,
      transparent: true,
      opacity: 0.45,
    });
    this.dustParticles = new THREE.Points(dustGeom, dustMat);
    this.dustParticles.visible = this.state === "desert_tumbleweed";
    this.scene.add(this.dustParticles);

    // Iniciar según estado
    this.setState(this.state);
    this.bindEvents();
    this.startLoop();
  }

  public setState(newState: WidgetMailboxState) {
    this.state = newState;

    if (newState === "arriving") {
      this.playArrival();
    } else if (newState === "emptied") {
      this.playEmptied();
    } else if (newState === "desert_tumbleweed") {
      this.playTumbleweed();
    }
  }

  public setModelo(newModelo: ModeloBuzon) {
    if (this.modelo === newModelo) return;
    this.modelo = newModelo;
    this.scene.remove(this.mailboxParts.group);
    this.mailboxParts.dispose();

    this.mailboxParts = createMailboxModel({
      modelo: this.modelo,
      coupleNames: this.coupleNames,
    });
    this.mailboxParts.group.scale.set(0.92, 0.92, 0.92);
    this.scene.add(this.mailboxParts.group);
    this.setState(this.state);
  }

  public updateCoupleNames(names: string) {
    this.coupleNames = names;
    this.mailboxParts.updateCoupleNames(names);
  }

  /**
   * Animación 1: Una carta vuela desde el aire, entra al buzón y el banderín se alza.
   */
  public playArrival() {
    this.tumbleweed.group.visible = false;
    this.dustParticles.visible = false;
    this.sunLight.color.setHex(0xfffaec);
    this.ambientLight.color.setHex(0xffffff);

    this.flyingLetterMesh.visible = true;
    this.sparkleParticles.visible = true;
    this.letterTrajectoryProgress = 0;
    this.isLetterFlying = true;

    // Resetear posiciones de destellos
    for (let i = 0; i < this.sparkleCount; i++) {
      this.sparklePositions[i * 3 + 0] = 0;
      this.sparklePositions[i * 3 + 1] = -100;
      this.sparklePositions[i * 3 + 2] = 0;
    }
    this.sparkleParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Animación 2: El buzón se cierra, el banderín baja y emite un halo de satisfacción "Al día".
   */
  public playEmptied() {
    this.isLetterFlying = false;
    this.flyingLetterMesh.visible = false;
    this.tumbleweed.group.visible = false;
    this.dustParticles.visible = false;
    this.sparkleParticles.visible = true;

    this.sunLight.color.setHex(0xfffaec);
    this.ambientLight.color.setHex(0xffffff);

    // Banderín abajo y puerta cerrada
    if (this.mailboxParts.flagPivot) {
      this.mailboxParts.flagPivot.rotation.z = 1.45;
    }
    this.mailboxParts.doorPivot.rotation.x = 0;

    // Generar halo suave de destellos sobre el buzón
    for (let i = 0; i < this.sparkleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 6.5;
      this.sparklePositions[i * 3 + 0] = Math.cos(angle) * dist;
      this.sparklePositions[i * 3 + 1] = 2.0 + Math.random() * 7.0;
      this.sparklePositions[i * 3 + 2] = Math.sin(angle) * dist;
    }
    this.sparkleParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Animación 3: Mucho tiempo sin cartas -> Viento crepuscular y un arbusto rodante 3D pasa frente al buzón.
   */
  public playTumbleweed() {
    this.isLetterFlying = false;
    this.flyingLetterMesh.visible = false;
    this.sparkleParticles.visible = false;

    // Iluminación cálida dorada de atardecer en el desierto
    this.sunLight.color.setHex(0xff9e00);
    this.ambientLight.color.setHex(0xffd166);

    this.tumbleweed.group.visible = true;
    this.dustParticles.visible = true;
    this.tumbleweed.reset(22);

    // Banderín abajo en señal de soledad
    if (this.mailboxParts.flagPivot) {
      this.mailboxParts.flagPivot.rotation.z = 1.45;
    }
    this.mailboxParts.doorPivot.rotation.x = 0;
  }

  private bindEvents() {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.container || this.isDestroyed) return;
      const w = this.container.clientWidth || 320;
      const h = this.container.clientHeight || 240;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    this.resizeObserver.observe(this.container);

    // Micro-inclinación táctil en widget
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const rect = this.container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.tilt.targetY = normX * 0.25;
      this.tilt.targetX = normY * 0.15;
    };

    this.container.addEventListener("mousemove", handleMove);
    this.container.addEventListener("touchmove", handleMove, { passive: true });
  }

  private startLoop() {
    const animate = () => {
      if (this.isDestroyed) return;
      this.animId = requestAnimationFrame(animate);

      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      // Suavizado de inclinación táctil
      this.tilt.x += (this.tilt.targetX - this.tilt.x) * Math.min(delta * 5.0, 1.0);
      this.tilt.y += (this.tilt.targetY - this.tilt.y) * Math.min(delta * 5.0, 1.0);

      this.mailboxParts.group.rotation.x = this.tilt.x;
      this.mailboxParts.group.rotation.y = this.tilt.y;

      // -----------------------------------------------------------------------
      // ACTUALIZACIÓN DE ANIMACIÓN 1: LLEGADA DE CARTA
      // -----------------------------------------------------------------------
      if (this.isLetterFlying) {
        this.letterTrajectoryProgress += delta * 0.45; // ~2.2 segundos de vuelo suave
        const p = Math.min(this.letterTrajectoryProgress, 1.0);

        // Curva Bézier cúbica de aproximación
        // Inicia en (18, 15, 20), hace un arco elevado y entra a (0, 3.8, 4.0)
        const start = new THREE.Vector3(18, 14, 20);
        const ctrl1 = new THREE.Vector3(8, 16, 12);
        const ctrl2 = new THREE.Vector3(-4, 9, 8);
        const end = new THREE.Vector3(0, 3.6, 2.0);

        const currentPos = new THREE.Vector3();
        // Fórmula de Bézier cúbica
        const u = 1 - p;
        const tt = p * p;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * p;

        currentPos.addScaledVector(start, uuu);
        currentPos.addScaledVector(ctrl1, 3 * uu * p);
        currentPos.addScaledVector(ctrl2, 3 * u * tt);
        currentPos.addScaledVector(end, ttt);

        this.flyingLetterMesh.position.copy(currentPos);
        this.flyingLetterMesh.rotation.z = Math.sin(p * Math.PI * 3) * 0.35;
        this.flyingLetterMesh.rotation.y = -p * Math.PI * 0.4;
        this.flyingLetterMesh.rotation.x = Math.sin(p * Math.PI * 2) * 0.25;

        // Estela de partículas detrás de la carta
        const pIdx = Math.floor(elapsed * 25) % this.sparkleCount;
        this.sparklePositions[pIdx * 3 + 0] = currentPos.x + (Math.random() - 0.5) * 0.8;
        this.sparklePositions[pIdx * 3 + 1] = currentPos.y + (Math.random() - 0.5) * 0.8;
        this.sparklePositions[pIdx * 3 + 2] = currentPos.z + (Math.random() - 0.5) * 0.8;
        this.sparkleParticles.geometry.attributes.position.needsUpdate = true;

        // La puerta se abre a medio vuelo
        if (p > 0.45) {
          this.mailboxParts.doorPivot.rotation.x = Math.min(
            this.mailboxParts.doorTargetAngle,
            (p - 0.45) * 2.8 * this.mailboxParts.doorTargetAngle
          );
        }

        // El banderín se eleva
        if (this.mailboxParts.flagPivot && p > 0.6) {
          this.mailboxParts.flagPivot.rotation.z = Math.max(0, 1.45 - (p - 0.6) * 3.6);
        }

        // Al finalizar la trayectoria entra al buzón
        if (p >= 1.0) {
          this.isLetterFlying = false;
          this.flyingLetterMesh.visible = false;
          this.onLetterArrived?.();

          // Cierre satisfactorio tras entrar
          setTimeout(() => {
            this.mailboxParts.doorPivot.rotation.x = 0;
          }, 800);
        }
      }

      // -----------------------------------------------------------------------
      // ACTUALIZACIÓN DE ANIMACIÓN 2: BUZÓN VACIADO (Halo de satisfacción)
      // -----------------------------------------------------------------------
      if (this.state === "emptied" && this.sparkleParticles.visible) {
        for (let i = 0; i < this.sparkleCount; i++) {
          this.sparklePositions[i * 3 + 1] += delta * 1.8;
          if (this.sparklePositions[i * 3 + 1] > 11.0) {
            this.sparklePositions[i * 3 + 1] = 1.0;
          }
        }
        this.sparkleParticles.geometry.attributes.position.needsUpdate = true;
      }

      // -----------------------------------------------------------------------
      // ACTUALIZACIÓN DE ANIMACIÓN 3: ARBUSTO DEL DESIERTO (Tumbleweed)
      // -----------------------------------------------------------------------
      if (this.state === "desert_tumbleweed") {
        this.tumbleweed.update(delta, 11.5);

        // Brisa sutil en el buzón
        this.mailboxParts.group.rotation.z = Math.sin(elapsed * 2.0) * 0.018;

        // Deriva de polvo desértico
        for (let i = 0; i < this.dustCount; i++) {
          this.dustPositions[i * 3 + 0] -= delta * 9.0;
          if (this.dustPositions[i * 3 + 0] < -18) {
            this.dustPositions[i * 3 + 0] = 20;
          }
        }
        this.dustParticles.geometry.attributes.position.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public dispose() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animId);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }

    this.mailboxParts.dispose();
    this.tumbleweed.dispose();
    this.flyingLetterMesh.geometry.dispose();
    (this.flyingLetterMesh.material as THREE.Material).dispose();
    this.sparkleParticles.geometry.dispose();
    (this.sparkleParticles.material as THREE.Material).dispose();
    this.dustParticles.geometry.dispose();
    (this.dustParticles.material as THREE.Material).dispose();
    this.renderer.dispose();
  }
}
