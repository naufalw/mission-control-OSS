import WebSocket from "ws";
import { data } from "./data";

const wss = new WebSocket.Server({ port: 8080 });
let currentIndex = 0;

function addSecondToTimestamp(timestamp) {
  // Convert timestamp to seconds
  const [hours, minutes, seconds] = timestamp.split(":").map(Number);
  let totalSeconds =
    hours * 3600 +
    minutes * 60 +
    seconds +
    Math.ceil((23435 + currentIndex - data[data.length - 1].messageId) / 7);

  // Convert total seconds back to HH:MM:SS
  const newHours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  totalSeconds %= 3600;
  const newMinutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const newSeconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${newHours}:${newMinutes}:${newSeconds}`;
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  const sendData = () => {
    if (currentIndex < data.length - 1) {
      const currentData = data[currentIndex];
      ws.send(JSON.stringify(currentData));
      currentIndex++;
    } else {
      const predictedData = {
        messageId: 23435 + currentIndex,
        predicted: true,
        location: {
          latitude:
            data[data.length - 1].location.latitude +
            (23435 + currentIndex - data[data.length - 1].messageId) * 0.021,
          longitude:
            data[data.length - 1].location.longitude -
            Math.ceil(
              (23435 + currentIndex - data[data.length - 1].messageId) / 3
            ) *
              0.01,
          altitude: 600,
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
        timestamp: addSecondToTimestamp(data[data.length - 1].timestamp),
      };
      ws.send(JSON.stringify(predictedData));
      currentIndex++;
    }
  };

  const intervalId = setInterval(sendData, 150);

  ws.on("close", () => {
    console.log("Client disconnected");
    clearInterval(intervalId);
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
