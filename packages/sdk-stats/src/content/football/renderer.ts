import gl from "gl";
import * as THREE from "three";
import type { VisualRenderer } from "../adapter.js";
import type { ObservationFrame } from "@flowstream/types";

// FIFA standard pitch dimensions (meters)
const PITCH_LENGTH = 105;
const PITCH_WIDTH = 68;
const HALF_LENGTH = PITCH_LENGTH / 2; // 52.5
const HALF_WIDTH = PITCH_WIDTH / 2; // 34

// Render output resolution
const WIDTH = 1050;
const HEIGHT = 680;

// Scene config
const BG_COLOR = 0x0a0a0f;
const FOG_NEAR = 100;
const FOG_FAR = 250;

// Team colors
const HOME_COLOR = 0xff6b6b;
const AWAY_COLOR = 0x4ecdc4;

// Ad board defaults
const DEFAULT_AD_COLORS = [0x00f5a0, 0xff6b6b, 0x4ecdc4, 0xffd700, 0x00f5a0];
const AD_BOARD_HEIGHT = 2.2;
const AD_BOARD_DEPTH = 0.15;

export class FootballRenderer implements VisualRenderer {
  readonly contentType = "football";

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private ballGroup: THREE.Group;
  private glowMesh!: THREE.Mesh;
  private ringMesh!: THREE.Mesh;
  private groundShadow!: THREE.Mesh;
  private playerMeshes: Map<number, THREE.Mesh> = new Map();
  private lastBallPos: [number, number] | null = null;
  private smoothBallPos: [number, number] | null = null;
  private glContext: ReturnType<typeof gl>;

  constructor() {
    this.glContext = gl(WIDTH, HEIGHT, { preserveDrawingBuffer: true });

    this.renderer = new THREE.WebGLRenderer({
      context: this.glContext as unknown as WebGLRenderingContext,
      antialias: false,
      canvas: {
        addEventListener: () => {},
        removeEventListener: () => {},
        style: {},
        width: WIDTH,
        height: HEIGHT,
      } as unknown as HTMLCanvasElement,
    });
    this.renderer.setSize(WIDTH, HEIGHT);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_COLOR);
    this.scene.fog = new THREE.Fog(BG_COLOR, FOG_NEAR, FOG_FAR);

    this.camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 1000);
    this.camera.position.set(0, 67, 83); // zoomed out ~45%
    this.camera.lookAt(0, 0, 0);

    this.setupLights();
    this.createGround();
    this.createLines();
    this.createGoals();
    this.createCornerFlags();
    this.createGrid();
    this.createAdvertisingBoards();
    this.ballGroup = this.createBall();
    this.groundShadow = this.createGroundShadow();
  }

  private setupLights(): void {
    this.scene.add(new THREE.AmbientLight(0x404060, 0.6));

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(30, 50, 30);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 200;
    mainLight.shadow.camera.left = -70;
    mainLight.shadow.camera.right = 70;
    mainLight.shadow.camera.top = 60;
    mainLight.shadow.camera.bottom = -60;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4ecdc4, 0.4);
    fillLight.position.set(-30, 30, -30);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff6b6b, 0.3);
    rimLight.position.set(0, 20, -50);
    this.scene.add(rimLight);
  }

  private createGround(): void {
    const pitchGeometry = new THREE.PlaneGeometry(
      PITCH_LENGTH + 10,
      PITCH_WIDTH + 10
    );
    const pitchMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a472a,
      roughness: 0.8,
      metalness: 0.1,
    });
    const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    this.scene.add(pitch);

    // Alternating grass stripes
    const stripeGeometry = new THREE.PlaneGeometry(
      PITCH_LENGTH / 10,
      PITCH_WIDTH + 10
    );
    const stripeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f5233,
      roughness: 0.8,
      metalness: 0.1,
    });
    for (let i = 0; i < 10; i += 2) {
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(
        -HALF_LENGTH + PITCH_LENGTH / 20 + i * (PITCH_LENGTH / 10),
        0.01,
        0
      );
      this.scene.add(stripe);
    }
  }

  private createLines(): void {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.8,
      transparent: true,
    });

    // Outer boundary
    this.scene.add(
      this.createRectangle(PITCH_LENGTH, PITCH_WIDTH, lineMaterial, 0.05)
    );

    // Center line
    const centerLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, -HALF_WIDTH),
      new THREE.Vector3(0, 0.05, HALF_WIDTH),
    ]);
    this.scene.add(new THREE.Line(centerLineGeom, lineMaterial));

    // Center circle
    this.scene.add(this.createCircle(9.15, lineMaterial, 0.05));

    // Penalty areas
    const penaltyAreaWidth = 40.3;
    const penaltyAreaDepth = 16.5;

    const leftPenalty = this.createRectangle(
      penaltyAreaDepth,
      penaltyAreaWidth,
      lineMaterial,
      0.05
    );
    leftPenalty.position.set(-HALF_LENGTH + penaltyAreaDepth / 2, 0, 0);
    this.scene.add(leftPenalty);

    const rightPenalty = this.createRectangle(
      penaltyAreaDepth,
      penaltyAreaWidth,
      lineMaterial,
      0.05
    );
    rightPenalty.position.set(HALF_LENGTH - penaltyAreaDepth / 2, 0, 0);
    this.scene.add(rightPenalty);

    // Goal areas
    const goalAreaWidth = 18.3;
    const goalAreaDepth = 5.5;

    const leftGoalArea = this.createRectangle(
      goalAreaDepth,
      goalAreaWidth,
      lineMaterial,
      0.05
    );
    leftGoalArea.position.set(-HALF_LENGTH + goalAreaDepth / 2, 0, 0);
    this.scene.add(leftGoalArea);

    const rightGoalArea = this.createRectangle(
      goalAreaDepth,
      goalAreaWidth,
      lineMaterial,
      0.05
    );
    rightGoalArea.position.set(HALF_LENGTH - goalAreaDepth / 2, 0, 0);
    this.scene.add(rightGoalArea);

    // Penalty spots
    const spotGeom = new THREE.CircleGeometry(0.15, 16);
    const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftSpot = new THREE.Mesh(spotGeom, spotMat);
    leftSpot.rotation.x = -Math.PI / 2;
    leftSpot.position.set(-HALF_LENGTH + 11, 0.06, 0);
    this.scene.add(leftSpot);

    const rightSpot = new THREE.Mesh(spotGeom, spotMat);
    rightSpot.rotation.x = -Math.PI / 2;
    rightSpot.position.set(HALF_LENGTH - 11, 0.06, 0);
    this.scene.add(rightSpot);

    const centerSpot = new THREE.Mesh(spotGeom, spotMat);
    centerSpot.rotation.x = -Math.PI / 2;
    centerSpot.position.set(0, 0.06, 0);
    this.scene.add(centerSpot);

    // Corner arcs
    const cornerRadius = 1;
    const cornerConfigs = [
      {
        x: -HALF_LENGTH,
        z: -HALF_WIDTH,
        startAngle: 0,
        endAngle: Math.PI / 2,
      },
      {
        x: -HALF_LENGTH,
        z: HALF_WIDTH,
        startAngle: -Math.PI / 2,
        endAngle: 0,
      },
      {
        x: HALF_LENGTH,
        z: -HALF_WIDTH,
        startAngle: Math.PI / 2,
        endAngle: Math.PI,
      },
      {
        x: HALF_LENGTH,
        z: HALF_WIDTH,
        startAngle: Math.PI,
        endAngle: Math.PI * 1.5,
      },
    ];
    for (const corner of cornerConfigs) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const angle =
          corner.startAngle +
          ((corner.endAngle - corner.startAngle) * i) / 16;
        points.push(
          new THREE.Vector3(
            corner.x + Math.cos(angle) * cornerRadius,
            0.05,
            corner.z + Math.sin(angle) * cornerRadius
          )
        );
      }
      this.scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          lineMaterial
        )
      );
    }

    // Penalty arcs
    const arcRadius = 9.15;
    const penaltySpotDist = 11;
    const penaltyBoxDepth = 16.5;
    const distToBoxEdge = penaltyBoxDepth - penaltySpotDist;
    const arcAngle = Math.acos(distToBoxEdge / arcRadius);

    const leftArcPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = -arcAngle + ((2 * arcAngle * i) / 32);
      leftArcPoints.push(
        new THREE.Vector3(
          -HALF_LENGTH + penaltySpotDist + Math.cos(angle) * arcRadius,
          0.05,
          Math.sin(angle) * arcRadius
        )
      );
    }
    this.scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(leftArcPoints),
        lineMaterial
      )
    );

    const rightArcPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = Math.PI - arcAngle + ((2 * arcAngle * i) / 32);
      rightArcPoints.push(
        new THREE.Vector3(
          HALF_LENGTH - penaltySpotDist + Math.cos(angle) * arcRadius,
          0.05,
          Math.sin(angle) * arcRadius
        )
      );
    }
    this.scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(rightArcPoints),
        lineMaterial
      )
    );
  }

  private createGoals(): void {
    this.createGoal(-HALF_LENGTH, HOME_COLOR);
    this.createGoal(HALF_LENGTH, AWAY_COLOR);
  }

  private createGoal(x: number, color: number): void {
    const goalWidth = 7.32;
    const goalHeight = 2.44;
    const postRadius = 0.06;

    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.8,
      emissive: color,
      emissiveIntensity: 0.3,
    });

    const postGeometry = new THREE.CylinderGeometry(
      postRadius,
      postRadius,
      goalHeight,
      16
    );

    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(x, goalHeight / 2, -goalWidth / 2);
    this.scene.add(leftPost);

    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(x, goalHeight / 2, goalWidth / 2);
    this.scene.add(rightPost);

    const crossbarGeometry = new THREE.CylinderGeometry(
      postRadius,
      postRadius,
      goalWidth,
      16
    );
    const crossbar = new THREE.Mesh(crossbarGeometry, postMaterial);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(x, goalHeight, 0);
    this.scene.add(crossbar);

    const netMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const netGeometry = new THREE.PlaneGeometry(2, goalHeight);
    const backNet = new THREE.Mesh(netGeometry, netMaterial);
    backNet.position.set(x + (x > 0 ? 1 : -1), goalHeight / 2, 0);
    backNet.rotation.y = Math.PI / 2;
    backNet.scale.z = goalWidth / 2;
    this.scene.add(backNet);
  }

  private createCornerFlags(): void {
    const flagPositions = [
      { x: -HALF_LENGTH, z: -HALF_WIDTH },
      { x: -HALF_LENGTH, z: HALF_WIDTH },
      { x: HALF_LENGTH, z: -HALF_WIDTH },
      { x: HALF_LENGTH, z: HALF_WIDTH },
    ];

    for (const pos of flagPositions) {
      const poleGeom = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        emissive: 0xffcc00,
        emissiveIntensity: 0.3,
      });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.set(pos.x, 1.25, pos.z);
      this.scene.add(pole);

      const flagShape = new THREE.Shape();
      flagShape.moveTo(0, 0);
      flagShape.lineTo(0.6, 0.18);
      flagShape.lineTo(0, 0.36);
      flagShape.lineTo(0, 0);

      const flagGeom = new THREE.ShapeGeometry(flagShape);
      const flagMat = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        side: THREE.DoubleSide,
      });
      const flag = new THREE.Mesh(flagGeom, flagMat);
      flag.position.set(pos.x, 2.3, pos.z);
      flag.rotation.y = Math.atan2(pos.z, pos.x) + Math.PI / 4;
      this.scene.add(flag);
    }
  }

  private createGrid(): void {
    const gridHelper = new THREE.GridHelper(150, 30, 0x1a1a2e, 0x1a1a2e);
    gridHelper.position.y = -0.1;
    this.scene.add(gridHelper);
  }

  private createAdvertisingBoards(): void {
    const offset = 4;
    this.createSideBoards(offset, -1);
    this.createEndBoards(offset, 1);
    this.createEndBoards(offset, -1);
  }

  private createSideBoards(offset: number, side: number): void {
    const z = (HALF_WIDTH + offset) * side;
    const numBoards = 6;
    const boardLength = PITCH_LENGTH / numBoards;

    for (let i = 0; i < numBoards; i++) {
      const color = DEFAULT_AD_COLORS[i % DEFAULT_AD_COLORS.length];
      const board = this.createAdBoard(boardLength, color);
      const startX = -HALF_LENGTH + boardLength / 2;
      board.position.set(startX + i * boardLength, AD_BOARD_HEIGHT / 2, z);
      board.rotation.y = side > 0 ? Math.PI : 0;
      this.scene.add(board);
    }
  }

  private createEndBoards(offset: number, side: number): void {
    const x = (HALF_LENGTH + offset) * side;
    const numBoards = 4;
    const boardLength = PITCH_WIDTH / numBoards;

    for (let i = 0; i < numBoards; i++) {
      const color = DEFAULT_AD_COLORS[(i + 3) % DEFAULT_AD_COLORS.length];
      const board = this.createAdBoard(boardLength, color);
      const startZ = -HALF_WIDTH + boardLength / 2;
      board.position.set(x, AD_BOARD_HEIGHT / 2, startZ + i * boardLength);
      board.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      this.scene.add(board);
    }
  }

  private createAdBoard(length: number, glowColor: number): THREE.Group {
    const group = new THREE.Group();

    const frameGeom = new THREE.BoxGeometry(
      length,
      AD_BOARD_HEIGHT,
      AD_BOARD_DEPTH
    );
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.3,
      metalness: 0.8,
    });
    const frame = new THREE.Mesh(frameGeom, frameMat);
    group.add(frame);

    const topTrim = new THREE.Mesh(
      new THREE.BoxGeometry(length + 0.1, 0.05, AD_BOARD_DEPTH + 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a3e,
        metalness: 0.9,
        roughness: 0.2,
      })
    );
    topTrim.position.y = AD_BOARD_HEIGHT / 2;
    group.add(topTrim);

    const bottomTrim = topTrim.clone();
    bottomTrim.position.y = -AD_BOARD_HEIGHT / 2;
    group.add(bottomTrim);

    const screenGeom = new THREE.PlaneGeometry(
      length - 0.1,
      AD_BOARD_HEIGHT - 0.1
    );
    const screenMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a1a,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.z = AD_BOARD_DEPTH / 2 + 0.05;
    screen.renderOrder = 1;
    group.add(screen);

    const glowStripGeom = new THREE.PlaneGeometry(
      length * 0.6,
      AD_BOARD_HEIGHT * 0.3
    );
    const glowStripMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const glowStrip = new THREE.Mesh(glowStripGeom, glowStripMat);
    glowStrip.position.z = AD_BOARD_DEPTH / 2 + 0.06;
    glowStrip.renderOrder = 2;
    group.add(glowStrip);

    const legGeom = new THREE.BoxGeometry(0.06, 0.3, 0.06);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x333344,
      metalness: 0.8,
    });

    const leftLeg = new THREE.Mesh(legGeom, legMat);
    leftLeg.position.set(
      -length / 2 + 0.3,
      -AD_BOARD_HEIGHT / 2 - 0.15,
      0
    );
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeom, legMat);
    rightLeg.position.set(
      length / 2 - 0.3,
      -AD_BOARD_HEIGHT / 2 - 0.15,
      0
    );
    group.add(rightLeg);

    return group;
  }

  private createBall(): THREE.Group {
    const group = new THREE.Group();
    const size = 0.5;

    const ballGeometry = new THREE.IcosahedronGeometry(size, 2);
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
    });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.castShadow = true;
    group.add(ballMesh);

    const pentagonMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
    });
    for (let i = 0; i < 12; i++) {
      const pentagon = new THREE.Mesh(
        new THREE.CircleGeometry(0.14, 5),
        pentagonMat
      );
      const phi = Math.acos(-1 + (2 * i + 1) / 12);
      const theta = Math.sqrt(12 * Math.PI) * phi;
      pentagon.position.setFromSphericalCoords(size + 0.01, phi, theta);
      pentagon.lookAt(0, 0, 0);
      group.add(pentagon);
    }

    this.glowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x00f5a0,
        transparent: true,
        opacity: 0.15,
      })
    );
    group.add(this.glowMesh);

    this.ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.9, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00f5a0,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      })
    );
    this.ringMesh.rotation.x = -Math.PI / 2;
    this.ringMesh.position.y = -0.45;
    group.add(this.ringMesh);

    group.position.set(0, size, 0);
    group.visible = false;
    this.scene.add(group);
    return group;
  }

  private createGroundShadow(): THREE.Mesh {
    const shadowGeom = new THREE.CircleGeometry(0.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    shadow.visible = false;
    this.scene.add(shadow);
    return shadow;
  }

  private createRectangle(
    width: number,
    height: number,
    material: THREE.LineBasicMaterial,
    y: number = 0
  ): THREE.Line {
    const points = [
      new THREE.Vector3(-width / 2, y, -height / 2),
      new THREE.Vector3(width / 2, y, -height / 2),
      new THREE.Vector3(width / 2, y, height / 2),
      new THREE.Vector3(-width / 2, y, height / 2),
      new THREE.Vector3(-width / 2, y, -height / 2),
    ];
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      material
    );
  }

  private createCircle(
    radius: number,
    material: THREE.LineBasicMaterial,
    y: number = 0,
    segments: number = 64
  ): THREE.Line {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      );
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      material
    );
  }

  /**
   * Render an ObservationFrame to a raw BMP Buffer.
   */
  renderFrame(frame: ObservationFrame): Buffer {
    const ballPos = frame.primaryPosition;
    if (ballPos) {
      const MAX_JUMP = 10;
      if (this.smoothBallPos) {
        const dx = Math.abs(ballPos[0] - this.smoothBallPos[0]);
        const dz = Math.abs(ballPos[1] - this.smoothBallPos[1]);
        if (dx < MAX_JUMP && dz < MAX_JUMP) {
          this.lastBallPos = ballPos;
        }
      } else {
        this.lastBallPos = ballPos;
      }
    }

    if (this.lastBallPos) {
      if (!this.smoothBallPos) {
        this.smoothBallPos = [...this.lastBallPos] as [number, number];
      }
      const lerp = 0.25;
      this.smoothBallPos[0] += (this.lastBallPos[0] - this.smoothBallPos[0]) * lerp;
      this.smoothBallPos[1] += (this.lastBallPos[1] - this.smoothBallPos[1]) * lerp;

      this.ballGroup.position.set(this.smoothBallPos[0], 0.5, this.smoothBallPos[1]);
      this.ballGroup.visible = true;
      this.groundShadow.position.x = this.smoothBallPos[0];
      this.groundShadow.position.z = this.smoothBallPos[1];
      this.groundShadow.visible = true;
    } else {
      this.ballGroup.visible = false;
      this.groundShadow.visible = false;
    }

    const players = frame.meta?.players as
      | Array<{ x: number; y: number; team: number; id: number }>
      | undefined;

    this.playerMeshes.forEach((mesh) => {
      mesh.visible = false;
    });

    if (players) {
      for (const p of players) {
        let pMesh = this.playerMeshes.get(p.id);
        if (!pMesh) {
          const pGeo = new THREE.SphereGeometry(0.4, 16, 16);
          const color =
            p.team === 0 ? HOME_COLOR : p.team === 1 ? AWAY_COLOR : 0xcccccc;
          const pMat = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.5,
            metalness: 0.1,
            emissive: color,
            emissiveIntensity: 0.2,
          });
          pMesh = new THREE.Mesh(pGeo, pMat);
          this.scene.add(pMesh);
          this.playerMeshes.set(p.id, pMesh);
        }

        const px = p.x * 105 - 52.5;
        const pz = p.y * 68 - 34;
        pMesh.position.set(px, 0.4, pz);
        pMesh.visible = true;
      }
    }

    this.renderer.render(this.scene, this.camera);

    const pixelBuffer = new Uint8Array(WIDTH * HEIGHT * 4);
    (this.glContext as any).readPixels(
      0,
      0,
      WIDTH,
      HEIGHT,
      (this.glContext as any).RGBA,
      (this.glContext as any).UNSIGNED_BYTE,
      pixelBuffer
    );

    return this.encodeBMP(pixelBuffer, WIDTH, HEIGHT);
  }

  private encodeBMP(rgbaBuffer: Uint8Array, width: number, height: number): Buffer {
    const header = Buffer.alloc(54);
    const rowSize = Math.floor((32 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;

    header.write("BM", 0);
    header.writeInt32LE(fileSize, 2);
    header.writeInt32LE(54, 10);

    header.writeInt32LE(40, 14);
    header.writeInt32LE(width, 18);
    header.writeInt32LE(height, 22);
    header.writeInt16LE(1, 26);
    header.writeInt16LE(32, 28);
    header.writeInt32LE(pixelArraySize, 34);

    const pixelData = Buffer.alloc(pixelArraySize);
    for (let y = 0; y < height; y++) {
      const rowStart = y * rowSize;
      const srcRowStart = y * width * 4;
      for (let x = 0; x < width; x++) {
        const srcOffset = srcRowStart + x * 4;
        const destOffset = rowStart + x * 4;
        pixelData[destOffset] = rgbaBuffer[srcOffset + 2]; // B
        pixelData[destOffset + 1] = rgbaBuffer[srcOffset + 1]; // G
        pixelData[destOffset + 2] = rgbaBuffer[srcOffset]; // R
        pixelData[destOffset + 3] = rgbaBuffer[srcOffset + 3]; // A
      }
    }

    return Buffer.concat([header, pixelData]);
  }
}
