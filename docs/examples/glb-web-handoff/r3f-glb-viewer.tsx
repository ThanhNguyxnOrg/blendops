/**
 * BlendOps Phase 12 — Reusable React Three Fiber (`@react-three/fiber` + `@react-three/drei`)
 * GLB Viewer Integration Example
 *
 * Designed to pair directly with a BlendOps GLB Web Handoff Manifest
 * (`schemas/glb-web-handoff-manifest.schema.json`) and the component shape rules in
 * `skills/three-fiber-component-shape-planner/SKILL.md`.
 *
 * Dependencies in target web app:
 *   npm install three @types/three @react-three/fiber @react-three/drei
 */

import React, {
  Component,
  Suspense,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Bounds, Center, Environment, Html, OrbitControls, useAnimations, useGLTF } from '@react-three/drei';
import type { AnimationClip, Group, Object3D } from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export interface BlendOpsGlbModelProps {
  /** Public URL or path to the `.glb` asset (e.g. `/models/product-hero.glb`). */
  url: string;
  /** Optional animation clip name to play on mount. */
  clipName?: string;
  /** Whether to auto-play the selected or first available animation clip (default: true). */
  autoPlay?: boolean;
  /** Uniform or 3-axis scale override (default: 1, assuming 1 unit = 1 meter). */
  scale?: number | [number, number, number];
  /** Root position offset in meters (default: [0, 0, 0]). */
  position?: [number, number, number];
  /** Root Euler rotation in radians (default: [0, 0, 0]). */
  rotation?: [number, number, number];
  /** Enable Draco decoder (`KHR_draco_mesh_compression`) or provide a custom decoder path. */
  dracoDecoderPath?: boolean | string;
  /** Enable Meshopt decoder (`EXT_meshopt_compression`). */
  enableMeshopt?: boolean;
  /** Enable KTX2 BasisU transcoder (`KHR_texture_basisu`) and provide transcoder folder URL. */
  basisTranscoderPath?: string;
  /** Apply castShadow/receiveShadow to child meshes (default: true). */
  shadows?: boolean;
  /** Whether to clear the `useGLTF` cache entry when this component unmounts (default: false). */
  clearCacheOnUnmount?: boolean;
  /** Callback fired once the GLB scene and animation clips are ready. */
  onLoaded?: (summary: {
    scene: Group;
    clipNames: string[];
    animations: AnimationClip[];
  }) => void;
}

export interface BlendOpsGlbModelHandle {
  /** Underlying Three.js root Group reference. */
  getRootGroup: () => Group | null;
  /** List of animation clip names discovered in the GLB. */
  getAvailableClips: () => string[];
  /** Play a named animation clip with optional crossfade duration in seconds. */
  playClip: (clipName: string, fadeSeconds?: number) => boolean;
  /** Stop all currently playing animation clips. */
  stopAllClips: () => void;
}

/**
 * Error boundary that catches GLB network, decoder, or parsing errors around `<Suspense>`
 * and renders a structured diagnostic fallback instead of crashing the React tree.
 */
export interface GlbErrorBoundaryProps {
  assetUrl: string;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface GlbErrorBoundaryState {
  error: Error | null;
}

export class GlbViewerErrorBoundary extends Component<GlbErrorBoundaryProps, GlbErrorBoundaryState> {
  public state: GlbErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): GlbErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  private handleReset = (): void => {
    this.setState({ error: null });
  };

  public render(): ReactNode {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.handleReset);
      }
      return (
        <div
          role="alert"
          style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '1px solid #ef4444',
            background: '#18181b',
            color: '#fca5a5',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.85rem',
          }}
        >
          <strong>GLB Viewer Load Error ({this.props.assetUrl})</strong>
          <p style={{ margin: '0.5rem 0' }}>{error.message}</p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #52525b',
              background: '#27272a',
              color: '#fafafa',
              cursor: 'pointer',
            }}
          >
            Retry Load
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Scene-level GLB model component using `@react-three/drei`'s `useGLTF` and `useAnimations`.
 */
export const BlendOpsGlbModel = forwardRef<BlendOpsGlbModelHandle, BlendOpsGlbModelProps>(
  function BlendOpsGlbModel(
    {
      url,
      clipName,
      autoPlay = true,
      scale = 1,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      dracoDecoderPath = true,
      enableMeshopt = false,
      basisTranscoderPath,
      shadows = true,
      clearCacheOnUnmount = false,
      onLoaded,
    },
    ref,
  ) {
    const groupRef = useRef<Group | null>(null);
    const gl = useThree((state) => state.gl);

    const gltf = useGLTF(url, dracoDecoderPath, enableMeshopt, (loader) => {
      if (enableMeshopt) {
        loader.setMeshoptDecoder(MeshoptDecoder);
      }
      if (basisTranscoderPath) {
        const ktx2Loader = new KTX2Loader();
        ktx2Loader.setTranscoderPath(basisTranscoderPath);
        ktx2Loader.detectSupport(gl);
        loader.setKTX2Loader(ktx2Loader);
      }
    });

    const { actions, names } = useAnimations(gltf.animations, groupRef);

    useEffect(() => {
      if (!gltf.scene) return;
      gltf.scene.traverse((obj: Object3D) => {
        if ('isMesh' in obj && (obj as unknown as { isMesh: boolean }).isMesh) {
          obj.castShadow = shadows;
          obj.receiveShadow = shadows;
        }
      });
      if (onLoaded) {
        onLoaded({
          scene: gltf.scene,
          clipNames: names,
          animations: gltf.animations,
        });
      }
    }, [gltf.scene, gltf.animations, names, shadows, onLoaded]);

    useEffect(() => {
      if (!autoPlay || names.length === 0) return;
      const targetName = clipName && actions[clipName] ? clipName : names[0];
      const action = targetName ? actions[targetName] : null;
      if (action) {
        action.reset().fadeIn(0.2).play();
      }
      return () => {
        if (action) {
          action.fadeOut(0.2);
        }
      };
    }, [actions, names, clipName, autoPlay]);

    useEffect(() => {
      return () => {
        if (clearCacheOnUnmount) {
          useGLTF.clear(url);
        }
      };
    }, [url, clearCacheOnUnmount]);

    useImperativeHandle(
      ref,
      () => ({
        getRootGroup: () => groupRef.current,
        getAvailableClips: () => [...names],
        playClip: (targetClip: string, fadeSeconds = 0.2) => {
          const nextAction = actions[targetClip];
          if (!nextAction) return false;
          for (const [name, act] of Object.entries(actions)) {
            if (name !== targetClip && act) {
              act.fadeOut(fadeSeconds);
            }
          }
          nextAction.reset().fadeIn(fadeSeconds).play();
          return true;
        },
        stopAllClips: () => {
          for (const act of Object.values(actions)) {
            act?.stop();
          }
        },
      }),
      [actions, names],
    );

    return (
      <group ref={groupRef} scale={scale} position={position} rotation={rotation} dispose={null}>
        <primitive object={gltf.scene} />
      </group>
    );
  },
);

export interface BlendOpsGlbViewerCanvasProps extends BlendOpsGlbModelProps {
  /** Environment preset from `@react-three/drei` (default: `'city'`). */
  environmentPreset?:
    | 'apartment'
    | 'city'
    | 'dawn'
    | 'forest'
    | 'lobby'
    | 'night'
    | 'park'
    | 'studio'
    | 'sunset'
    | 'warehouse';
  /** Automatically center and fit camera bounds around the loaded model (default: true). */
  autoFitBounds?: boolean;
  /** CSS height of the viewer container (default: `'480px'`). */
  height?: string;
}

/**
 * Complete drop-in React Three Fiber viewer canvas with error boundary,
 * `<Suspense>` loading state, environment lighting, bounds framing, and OrbitControls.
 */
export function BlendOpsGlbViewerCanvas({
  url,
  environmentPreset = 'city',
  autoFitBounds = true,
  height = '480px',
  ...modelProps
}: BlendOpsGlbViewerCanvasProps) {
  return (
    <GlbViewerErrorBoundary assetUrl={url}>
      <div style={{ width: '100%', height, position: 'relative', background: '#09090b' }}>
        <Canvas shadows dpr={[1, 2]} camera={{ position: [2.2, 1.6, 2.8], fov: 45 }}>
          <Suspense
            fallback={
              <Html center>
                <span
                  style={{
                    color: '#e4e4e7',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '0.85rem',
                  }}
                >
                  Loading {url}...
                </span>
              </Html>
            }
          >
            <Environment preset={environmentPreset} />
            {autoFitBounds ? (
              <Bounds fit clip observe margin={1.25}>
                <Center top>
                  <BlendOpsGlbModel url={url} {...modelProps} />
                </Center>
              </Bounds>
            ) : (
              <BlendOpsGlbModel url={url} {...modelProps} />
            )}
          </Suspense>
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
        </Canvas>
      </div>
    </GlbViewerErrorBoundary>
  );
}
