import re
import json
from datetime import datetime, timedelta


def parse_data(input_file, output_file):
    with open(input_file, 'r') as f:
        content = f.read()

    pattern = r'Message (\d+).*?L\[([-\d.]+),([-\d.]+),([-\d.]+)\].*?I\[([-\d.]+)\].*?R\[([-\d.]+),([-\d.]+),([-\d.]+)\].*?A\[([-\d.]+),([-\d.]+),([-\d.]+)\].*?G\[([-\d.]+),([-\d.]+),([-\d.]+)\].*?RD\[(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\]'
    matches = re.finditer(pattern, content, re.DOTALL)

    data = []
    last_timestamp = None
    millisecond_counter = 0

    for match in matches:
        _, _, _, hour, minute, second = map(
            int, match.group(15, 16, 17, 18, 19, 20))
        # Using 2000 as a reference year
        current_timestamp = datetime(2000, 1, 1, hour, minute, second)

        if current_timestamp == last_timestamp:
            millisecond_counter += 1
        else:
            millisecond_counter = 0

        current_timestamp += timedelta(milliseconds=millisecond_counter)
        last_timestamp = current_timestamp.replace(microsecond=0)

        data_point = {
            "messageId": int(match.group(1)),
            "predicted": False,
            "location": {
                "latitude": float(match.group(2)),
                "longitude": float(match.group(3)),
                "altitude": float(match.group(4))
            },
            "rotation": {
                "yaw": float(match.group(6)),
                "pitch": float(match.group(7)),
                "roll": float(match.group(8))
            },
            "gyroscopicAcceleration": {
                "rollAccel": float(match.group(12)),
                "pitchAccel": float(match.group(13)),
                "yawAccel": float(match.group(14))
            },
            # Format as HH:MM:SS.mmm
            "timestamp": current_timestamp.strftime("%H:%M:%S.%f")[:-3]
        }
        data.append(data_point)

    with open(output_file, 'w') as f:
        f.write('import { BeaconData } from "./lib/types";\n')
        f.write("export const data: BeaconData[] = ")
        json.dump(data, f, indent=2)
        f.write(";")


parse_data('input_2.txt', 'data.ts')
