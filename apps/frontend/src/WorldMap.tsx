import { useState, useEffect } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three"; // @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"; // Make sure this is available
import { $locations } from "./a";
import { useStore } from "@nanostores/react";

const WorldMap = ({
  lat,
  long,

  pitch,
  predicted,
  roll,
  yaw,
  locations,
}: {
  lat: number;
  long: number;
  predicted: boolean;

  pitch: number;
  roll: number;
  yaw: number;
  locations: {
    latitude: number;
    longitude: number;
    altitude: number;
  }[];
}) => {
  const locationsNew = useStore($locations);
  const [object, setObject] = useState<THREE.Object3D | null>(null); // State to store the loaded 3D object
  const [lastRealData, setLastRealData] = useState<{
    lat: number;
    long: number;
  } | null>(null);

  // Load the satellite model
  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(
      "src/assets/nasa_sat.glb", // Update with the correct path to your .glb file
      (gltf: any) => {
        const loadedObject = gltf.scene;
        loadedObject.scale.set(0.0015, 0.0015, 0.0015); // Adjust the scale as necessary
        setObject(loadedObject); // Store the loaded object in the state
      },
      undefined, // Optional progress function
      (error: any) => {
        console.error("An error occurred while loading the GLB model:", error);
      }
    );
  }, []);

  // Set trajectory markers and the satellite position
  useEffect(() => {
    if (!predicted) {
      setLastRealData({ lat, long });
    }

    //@ts-ignore
    $locations.set([
      //@ts-ignore
      ...locationsNew,
      //@ts-ignore
      {
        name: predicted ? "Predicted Trajectory" : "Real Trajectory",
        lat: lat,
        lng: long,
        alt: 0.2,
      },
    ]);

    // Update objectDatas to include the satellite and the trajectory markers
  }, [locations, lat, long]);

  return (
    <div className="my-auto">
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        objectLabel="name"
        objectLat="lat"
        objectLng="lng"
        objectAltitude="alt"
        animateIn={false}
        height={1000}
        width={1400}
        objectsData={[
          ...locationsNew,
          {
            name: "Satellite",
            lat: lastRealData?.lat,
            lng: lastRealData?.long,
            alt: 0.2,
          },
        ]}
        arcAltitude={0.2}
        // arcsData={[
        //   {
        //     startLat: start_lat,
        //     startLng: start_long,
        //     endLat: lat,
        //     endLng: long,
        //     color: "red",
        //   },
        // ]}

        objectRotation={{ x: roll, y: pitch, z: yaw }}
        // Conditionally render the satellite or a red sphere for markers
        objectThreeObject={(obj) => {
          //@ts-ignore
          if (obj.name === "Satellite") {
            return object.clone();
            //@ts-ignore
          } else if (obj.name === "Predicted Trajectory") {
            return new THREE.Mesh(
              new THREE.SphereGeometry(0.07, 32, 32), // Create a red sphere for other points
              new THREE.MeshBasicMaterial({ color: "gray" })
            );
          } else {
            return new THREE.Mesh(
              new THREE.SphereGeometry(0.07, 32, 32), // Create a red sphere for other points
              new THREE.MeshBasicMaterial({ color: "red" })
            );
          }
        }}
        //   obj.name === "Satellite" && object
        //     ? object.clone() // Use the satellite model for the last point (the satellite)
        //     : new THREE.Mesh(
        //         new THREE.SphereGeometry(0.07, 32, 32), // Create a red sphere for other points
        //         new THREE.MeshBasicMaterial({ color: "red" })
        //       )
        //
      />
    </div>
  );
};

export default WorldMap;
