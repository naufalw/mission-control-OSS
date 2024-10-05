import { useState, useEffect, useCallback } from "react";
import { BeaconData } from "./lib/types";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Canvas } from "@react-three/fiber";
import { OpenAI } from "openai";
import Markdown from "react-markdown";

//@ts-ignore
import { AxesHelper } from "three";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

import Model from "./Model";

import WorldMap from "./WorldMap";
import { Button } from "./components/ui/button";
import { Copy, Plane, Search, Send } from "lucide-react";

const getFwAzimuth = ({
  lat1,
  long1,
  lat2,
  long2,
}: {
  lat1: number;
  long1: number;
  lat2: number;
  long2: number;
}) => {
  // Convert latitude and longitude to radians
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (long1 * Math.PI) / 180;
  const λ2 = (long2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360; // in degrees

  return bearing;
};

function App() {
  const [changeBg, setChangeBg] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [allData, setAllData] = useState<BeaconData[]>([]);

  const [fwAzimuth, setFwAzimuth] = useState(0);

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

  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_KEY,
    dangerouslyAllowBrowser: true,
  });

  const onSend = async () => {
    setAnswer("Thinking...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",

      messages: [
        {
          role: "system",
          content:
            "You are an intelligent assistant integrated into a satellite tracking website, designed to help users monitor and understand the real-time beacon data of satellites. Users may inquire about various parameters, including satellite location (latitude, longitude, and altitude), gyroscope acceleration, and other analysis based on the data given. You have access to up-to-date data feeds providing information on the satellites’ trajectories and location of the satellites. You will be answering question only based on the data given below. \n",
        },
        {
          role: "user",
          content: input + ` \nCurrent data: ${JSON.stringify(allData)}`,
        },
      ],
    });
    // setInput("Ask anything...");
    setAnswer(completion.choices[0].message.content || "");
  };

  const updateCurrentData = useCallback((newData: BeaconData) => {
    setFwAzimuth(
      getFwAzimuth({
        lat1: currentData.location.latitude,
        long1: currentData.location.longitude,
        lat2: newData.location.latitude,
        long2: newData.location.longitude,
      })
    );
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
      setAllData((prev) => {
        const updatedData = [...prev, newData];

        return updatedData;
      });
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [updateCurrentData]);

  return (
    <div className="flex bg-black flex-col h-screen w-screen text-white font-mono">
      {/* Main content area */}
      <div className="h-[96%] w-full grid grid-cols-[1fr_23rem] ">
        {/* Left side - placeholder for potential content */}
        <div className="bg-black-500 flex items-center justify-center overflow-hidden h-[99.5%] w-full ">
          <div className="bg-black bg-opacity-70 items-center transparent absolute top-0 h-20 z-10 w-[calc(100vw-23rem)] flex justify-between">
            <div className="flex items-center h-full">
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
              <div className="ml-8">Bearing: {fwAzimuth.toFixed(2)}</div>
            </div>
            <div className="mr-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="border rounded-none bg-black hover:bg-accent hover:text-accent-foreground">
                    Ask anything
                    <Search className="ml-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-black text-white">
                  <div className="flex items-center min-w-[400px] mt-5">
                    <div className="grid flex-1 gap-2">
                      <Input
                        id="link"
                        className="bg-black"
                        placeholder="Ask anything..."
                        onChange={(e) => setInput(e.target.value)}
                        value={input}
                      />
                      <Button
                        variant={"secondary"}
                        className="gap-2 "
                        onClick={onSend}
                      >
                        Send <Send className="ml-2" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-full p-2 h-fit max-h-[300px] overflow-y-auto">
                      <Markdown>{answer}</Markdown>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <WorldMap
            predicted={currentData.predicted}
            lat={currentData.location.latitude}
            long={currentData.location.longitude}
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
                  right: 0,
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
              <div className="h-full">
                <Canvas camera={{ zoom: 30 }} className="h-full">
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
                <div className="text-sm -mt-14 flex gap-x-2">
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
              className="h-[22rem] w-[22.5rem]"
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
              {!currentData.predicted && (
                <Marker
                  coordinates={[
                    currentData.location.longitude,
                    currentData.location.latitude,
                  ]}
                  fill="#FFFFFF"
                >
                  <text textAnchor="middle" fill={"#F53"} fontSize={60}>
                    •
                  </text>
                </Marker>
              )}

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
          <div className="bg-red-500 px-2">
            {currentData.predicted ? "Predicted Data" : ""}
          </div>
          <div className={changeBg ? "bg-sky-500 px-2" : "px-2"}>
            Message ID: {currentData.messageId}
          </div>
          <div className="ml-2">
            {currentData.predicted
              ? "Time: --:--:--"
              : `Time: ${currentData.timestamp.slice(0, -4)}`}
          </div>

          {/* <div>{zuluTime}</div> */}
        </div>
      </div>
    </div>
  );
}

export default App;
