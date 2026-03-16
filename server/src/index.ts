import express from "express";
import cors from "cors";
import { hubsRouter } from "./routes/hubs.js";
import { companiesRouter } from "./routes/companies.js";
import { flowsRouter } from "./routes/flows.js";
import { scenariosRouter } from "./routes/scenarios.js";
import { exportRouter } from "./routes/export.js";

const app = express();
const port = parseInt(process.env.PORT ?? "8080", 10);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "suns-ai-api" });
});

// Routes
app.use("/api/hubs", hubsRouter);
app.use("/api/hubs", companiesRouter);
app.use("/api/hubs", flowsRouter);
app.use("/api/hubs", scenariosRouter);
app.use("/api/hubs", exportRouter);

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(port, () => {
  console.log(`suns-ai API listening on port ${port}`);
});
