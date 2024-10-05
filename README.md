# Mission Control

Mission control is a data visualization web application that uses the WebSocket protocol to stream data from a the ANT61 Beacon device.

# Getting Started

1. Converting the ANT61 Beacon data to JSON format

Put your ANT61 Beacon data in the `input_2.txt` file in the mission-control/apps/server directory.

```sh
cd mission-control/apps/server
python3 beacon_to_json.py
```

2. Installing the dependencies

```sh
git clone https://github.com/naufalw/mission-control.git
cd mission-control
pnpm install
```

# Running the Application

```sh
pnpm dev
```

> Strictly run only with the `pnpm dev` command. Do not run with `npm run dev` or `yarn dev`.

# Dependencies

- pnpm
- node >= 18
- ws (websocket)
- React
- React Simple Maps
- Recharts
- Globe.gl
- Three.js
- nanostores and nanostores/react
- turbo (monorepo)
- TailwindCSS
- Prettier
- @fontsource/ibm-plex-mono (font)
- @shadcn/ui (components)
- @react-three/fiber
- @react-three/drei
- lucide-react
- OpenAI

> For more information about the dependencies, please refer to the `package.json` file.
