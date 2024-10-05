import { useState, useEffect, useCallback } from "react";
import { BeaconData } from "./lib/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Canvas } from "@react-three/fiber";

//@ts-ignore
import { AxesHelper } from "three";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

import Model from "./Model";

import WorldMap from "./WorldMap";

function App() {
  const [zuluTime, setZuluTime] = useState("");
  const [changeBg, setChangeBg] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [currentData, setCurrentData] = useState<BeaconData>({
    messageId: 0,
    predicted: false,
    location: {
      latitude: 0,
      longitude: 0,
      altitude: 0,
    },
    rotation: {
      yaw: 0,
      pitch: 0,
      roll: 0,
    },
    gyroscopicAcceleration: {
      rollAccel: 0,
      pitchAccel: 0,
      yawAccel: 0,
    },
    timestamp: "00:00:00.000",
  });

  const [location, setLocation] = useState<
    {
      latitude: number;
      longitude: number;
      altitude: number;
      predicted: boolean;
    }[]
  >([]);

  const [gyroAcceleration, setGyroAcceleration] = useState<
    {
      rollAccel: number;
      pitchAccel: number;
      yawAccel: number;
    }[]
  >([]);

  const updateCurrentData = useCallback((newData: BeaconData) => {
    setCurrentData(newData);
    setChangeBg(true);
    setTimeout(() => {
      setChangeBg(false);
    }, 1000);

    setGyroAcceleration((prev) => [...prev, newData.gyroscopicAcceleration]);
    setLocation((prev) => [
      ...prev,
      { ...newData.location, predicted: currentData.predicted },
    ]);
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const newData: BeaconData = JSON.parse(event.data);
      setIsConnected(true);
      updateCurrentData(newData);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [updateCurrentData]);

  useEffect(() => {
    const updateZuluTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      const seconds = String(now.getUTCSeconds()).padStart(2, "0");
      setZuluTime(`${hours}:${minutes}:${seconds}Z`);
    };

    updateZuluTime(); // Initial call
    const intervalId = setInterval(updateZuluTime, 1000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="flex bg-black flex-col h-screen w-screen text-white font-mono">
      {/* Main content area */}
      <div className="h-[96%] w-full grid grid-cols-[1fr_23rem] ">
        {/* Left side - placeholder for potential content */}
        <div className="bg-black-500 flex items-center justify-center overflow-hidden h-full w-full ">
          <div className="bg-black bg-opacity-70 items-center transparent absolute top-0 h-20 z-10 w-[calc(100vw-23rem)] flex">
            <div className="text-lg font-bold h-full bg-[#FFD531] flex items-center px-4">
              <div className="text-black text-xl">
                <h1>Mission</h1>
                <h1>Control</h1>
              </div>
            </div>
            <div className="ml-8">Mission: Launch 1</div>
            <div className="ml-8">
              Altitude: {currentData.location.altitude}
            </div>
          </div>
          <WorldMap
            predicted={currentData.predicted}
            start_lat={location[0]?.latitude || 0}
            start_long={location[0]?.longitude || 0}
            lat={currentData.location.latitude}
            long={currentData.location.longitude}
            altitude={currentData.location.altitude}
            pitch={currentData.rotation.pitch}
            roll={currentData.rotation.roll}
            yaw={currentData.rotation.yaw}
            locations={location}
          />
        </div>

        {/* Right side - control panel */}
        <div className=" border-l-2 border-gray-800   ">
          <div className=" border-b-2 border-gray-700 h-[33vh] ">
            <p className="text-lg">Beacon Acceleration</p>
            {currentData.predicted ? (
              <div className="h-full w-full justify-center items-center flex">
                <p className="">Not Simulated</p>
              </div>
            ) : (
              <LineChart
                width={350}
                height={300}
                data={gyroAcceleration.slice(-100)}
                margin={{
                  top: 10,
                  right: 5,
                  left: 0,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="timestamp" stroke="#FFFFFF" />
                <YAxis stroke="#FFFFFF" />
                <Tooltip />
                <Legend />
                <Line
                  type="basis"
                  dataKey="rollAccel"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Roll"
                  dot={false}
                />
                <Line
                  type="basis"
                  dataKey="pitchAccel"
                  stroke="#82ca9d"
                  activeDot={{ r: 8 }}
                  name="Pitch"
                  dot={false}
                />
                <Line
                  type="basis"
                  dataKey="yawAccel"
                  stroke="#ffc658"
                  activeDot={{ r: 8 }}
                  name="Yaw"
                  dot={false}
                />
              </LineChart>
            )}
          </div>
          <div className=" border-b-2 border-gray-700 h-[25vh]">
            <p className="text-lg">Beacon Orientation</p>
            {currentData.predicted ? (
              <div className="h-full w-full justify-center items-center flex">
                <p className="">Not Simulated</p>
              </div>
            ) : (
              <div className="">
                <Canvas camera={{ zoom: 30 }} className="h-fit">
                  <primitive object={new AxesHelper(0.15)} />
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[2, 5, 2]} intensity={5} />
                  <directionalLight position={[-2, 5, -2]} intensity={5} />
                  <directionalLight position={[-2, -5, -2]} intensity={5} />

                  <Model
                    yaw={currentData.rotation.yaw}
                    pitch={currentData.rotation.pitch}
                    roll={currentData.rotation.roll}
                  />
                </Canvas>
                <div className="text-sm -mt-8 flex gap-x-2">
                  <p>Yaw: {currentData.rotation.yaw.toFixed(2)}</p>
                  <p>Pitch: {currentData.rotation.pitch.toFixed(2)} </p>
                  <p>Roll: {currentData.rotation.roll.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
          <div className=" ">
            <p className="text-lg">Beacon Location</p>
            <ComposableMap
              className="h-[22rem] w-[22rem]"
              projectionConfig={{
                rotate: [
                  -currentData.location.longitude,
                  -currentData.location.latitude,
                  0,
                ],
                scale: 2000,
              }}
            >
              <Geographies geography={"src/assets/world-countries.json"}>
                {({ geographies }): any =>
                  geographies.map((geo: { rsmKey: any }) => (
                    <Geography
                      fill="#FFFFFF"
                      key={geo.rsmKey}
                      geography={geo}
                    />
                  ))
                }
              </Geographies>
              {location.map(({ latitude, longitude, predicted }) => {
                return (
                  <Marker coordinates={[longitude, latitude]} fill="#FFFFFF">
                    <text
                      textAnchor="middle"
                      fill={predicted ? "#808080" : "#F53"}
                    >
                      •
                    </text>
                  </Marker>
                );
              })}
            </ComposableMap>
            <div className="absolute bottom-10 bg-gray-600">
              Lat: {currentData.location.latitude.toFixed(2)} Long:{" "}
              {currentData.location.longitude.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="bg-gray-800 p-2 flex justify-between items-center">
        <div className="flex items-center">
          <div
            className={isConnected ? "bg-green-500 px-2" : "bg-red-500 px-2"}
          >
            Connection: {isConnected ? "Connected" : "Disconnected"}
          </div>
          <span
            className={
              " h-4 w-4 ml-4 rounded-full opacity-100" +
              (isConnected ? " animate-ping bg-green-500" : "bg-red-500")
            }
          ></span>
        </div>

        <div className="flex space-x-4">
          <div className="bg-red-500">
            {currentData.predicted ? "Predicted Data" : ""}
          </div>
          <div className={changeBg ? "bg-sky-500 px-2" : "px-2"}>
            Message ID: {currentData.messageId}
          </div>
          <div>Time: {currentData.timestamp.slice(0, -4)}</div>
          {/* <div>{zuluTime}</div> */}
        </div>
      </div>
    </div>
  );
}

export default App;
