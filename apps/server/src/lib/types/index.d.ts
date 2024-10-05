export interface BeaconData {
    messageId: number;
    predicted: boolean;
    location: {
      latitude: number;
      longitude: number;
      altitude: number;
    };
    rotation: {
      yaw: number;
      pitch: number;
      roll: number;
    };
    gyroscopicAcceleration: {
      rollAccel: number;
      pitchAccel: number;
      yawAccel: number;
    };
    timestamp: string;
  }



  