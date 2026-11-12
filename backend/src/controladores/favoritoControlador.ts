import { Request, Response } from "express";
import { FavoritoService } from "../servicios/FavoritoService";
import { idUsuarioDe } from "./helpers";

const servicio = new FavoritoService();

export const favoritoControlador = {
  // GET /api/usuarios/:idUsuario/favoritos
  async listar(req: Request, res: Response) {
    res.json(await servicio.listar(idUsuarioDe(req)));
  },
  // POST /api/usuarios/:idUsuario/favoritos   { "albumId": "..." }
  async agregar(req: Request, res: Response) {
    await servicio.agregar(idUsuarioDe(req), String(req.body?.albumId ?? ""));
    res.status(201).json({ ok: true });
  },
  // DELETE /api/usuarios/:idUsuario/favoritos/:albumId
  async eliminar(req: Request, res: Response) {
    await servicio.eliminar(idUsuarioDe(req), String(req.params.albumId));
    res.status(204).end();
  },
  // DELETE /api/usuarios/:idUsuario/favoritos
  async eliminarTodos(req: Request, res: Response) {
    res.json(await servicio.eliminarTodos(idUsuarioDe(req)));
  },
};
