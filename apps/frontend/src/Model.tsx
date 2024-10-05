import { useLoader } from "@react-three/fiber";

// @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function Model({
  yaw,
  pitch,
  roll,
}: {
  yaw: number;
  pitch: number;
  roll: number;
}) {
  const gltf = useLoader(GLTFLoader, "src/assets/beacon.glb");
  return <primitive rotation={[roll, pitch, yaw]} object={gltf.scene} />;
}
