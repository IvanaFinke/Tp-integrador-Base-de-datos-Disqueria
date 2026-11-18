import { Request } from "express";
import { config } from "../config/env";
import { solicitudInvalida } from "../dominio/errores";

export const idUsuarioDe = (req: Request): number => {
  const v = req.params.idUsuario ?? req.header("X-Usuario-Id") ?? config.usuarioDemo;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw solicitudInvalida("Id de usuario inválido");
  return n;
};

// Usuario del header X-Usuario-Id, o undefined si no hay sesión.
export const idUsuarioOpcional = (req: Request): number | undefined =>
  req.header("X-Usuario-Id") ? idUsuarioDe(req) : undefined;

export const numeroQuery = (v: unknown, porDefecto: number, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : porDefecto;
};

export const ordenQuery = (v: unknown): "asc" | "desc" | undefined => (v === "asc" || v === "desc" ? v : undefined);
