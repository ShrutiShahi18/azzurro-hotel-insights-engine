import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// 404 handler — catches any /api/* path that didn't match a route
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found", code: "NOT_FOUND" });
});

// Global error handler — ensures all unhandled errors return structured JSON,
// never the default Express HTML error page
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  const message = err instanceof Error ? err.message : "An unexpected error occurred";
  res.status(500).json({ error: message, code: "INTERNAL_ERROR" });
});

export default app;
