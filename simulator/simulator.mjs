const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const INTERVAL_MS = 5_000;
const DEVICE_COUNT = 5;

const devices = Array.from({ length: DEVICE_COUNT }, (_, i) => ({
  id: `device-${String(i + 1).padStart(2, "0")}`,
  name: `Lab Device ${String(i + 1).padStart(2, "0")}`,
  running: true,
}));

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function registerDevices() {
  for (const device of devices) {
    try {
      await request("/api/devices", {
        method: "POST",
        body: JSON.stringify({ id: device.id, name: device.name }),
      });
      console.log(`Registered ${device.id}`);
    } catch (error) {
      if (String(error).includes("409")) console.log(`${device.id} already registered`);
      else console.error(`Failed to register ${device.id}:`, error.message);
    }
  }
}

async function sendHeartbeat(device) {
  if (!device.running) return;

  try {
    await request(`/api/devices/${device.id}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        status: "OK",
      }),
    });
    console.log(`[${new Date().toLocaleTimeString()}] ${device.id} -> heartbeat`);
  } catch (error) {
    console.error(`${device.id}:`, error.message);
  }
}

function printDevices() {
  console.log("\nDevices:");
  for (const device of devices) {
    console.log(`  ${device.id}: ${device.running ? "RUNNING" : "STOPPED"}`);
  }
  console.log();
}

function handleCommand(line) {
  const [command, id] = line.trim().split(/\s+/);

  if (command === "stop" && id) {
    const device = devices.find((item) => item.id === id);
    if (!device) return console.log(`Unknown device: ${id}`);
    device.running = false;
    console.log(`${id} stopped. It should become OFFLINE after 30 seconds.`);
    return;
  }

  if (command === "start" && id) {
    const device = devices.find((item) => item.id === id);
    if (!device) return console.log(`Unknown device: ${id}`);
    device.running = true;
    console.log(`${id} started.`);
    sendHeartbeat(device);
    return;
  }

  if (command === "list") return printDevices();
  if (command === "help") {
    console.log("Commands: stop <device-id>, start <device-id>, list, help, exit");
    return;
  }

  if (command === "exit") process.exit(0);
  console.log("Unknown command. Type 'help'.");
}

await registerDevices();
await Promise.all(devices.map(sendHeartbeat));

setInterval(() => {
  for (const device of devices) sendHeartbeat(device);
}, INTERVAL_MS);

console.log(`\nSimulator running against ${BASE_URL}`);
console.log("Commands: stop <device-id>, start <device-id>, list, help, exit\n");

process.stdin.setEncoding("utf8");
process.stdin.on("data", handleCommand);
