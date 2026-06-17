import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import { getFirebaseAdmin } from "./config/firebase.js";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env") });

const PORT = Number(process.env.PORT || 4173);
const HOST = "0.0.0.0";

try {
  await connectDB();
  getFirebaseAdmin();
  const app = createApp();
  app.listen(PORT, HOST, () => {
    console.log(`CarbonTrack server running on http://${HOST}:${PORT}`);
  });
} catch (error) {
  console.error("Startup aborted:", error.message);
  process.exit(1);
}
