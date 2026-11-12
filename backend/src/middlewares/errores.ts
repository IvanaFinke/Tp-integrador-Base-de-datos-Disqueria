import { NextFunction, Request, Response } from "express";
import { ErrorApp } from "../dominio/errores";

export function manejarErrores(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErrorApp) {
    return res.status(err.status).json({ error: err.message, ...(err as any).errores && { errores: (err as any).errores } });
  }
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "JSON inválido" });
  if (["ECONNREFUSED", "ETIMEDOUT", "PROTOCOL_CONNECTION_LOST"].includes(err?.code) || err?.name === "MongoServerSelectionError") {
    console.error(err);
    return res.status(503).json({ error: "No se pudo conectar con la base de datos", detalle: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno", detalle: err?.message });
}
