import * as THREE from "three";
import { ModeloBuzon, ICitaResponse } from "@/types";

export type MailboxStage =
  | "lateral_login"
  | "rotating_to_front"
  | "front_closed"
  | "door_opening"
  | "letters_floating"
  | "letter_expanded"
  | "docking"
  | "minimized_widget";

export interface MailboxModelParts {
  group: THREE.Group;
  doorPivot: THREE.Group;
  flagPivot: THREE.Group | null;
  latchPivot: THREE.Group | null;
  keyPivot: THREE.Group | null;
  interiorLight: THREE.PointLight;
  doorTargetAngle: number;
  raycastTargets: THREE.Object3D[];
  updateCoupleNames: (names: string) => void;
  dispose: () => void;
}

export interface EnvelopeModelParts {
  group: THREE.Group;
  flapPivot: THREE.Group;
  envelopeMesh: THREE.Mesh;
  raycastTargets: THREE.Object3D[];
  updateCita: (cita: ICitaResponse | null, novio: string, novia: string) => void;
  dispose: () => void;
}
