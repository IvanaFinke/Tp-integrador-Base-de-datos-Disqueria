import { Request, Response } from "express";
import { UsuarioService } from "../servicios/UsuarioService";
import { idUsuarioDe } from "./helpers";

const servicio = new UsuarioService();

export const usuarioControlador = {
  // POST /api/sesion   { "email": "...", "contrasenia": "..." }
  async iniciarSesion(req: Request, res: Response) {
    res.json(await servicio.iniciarSesion(req.body));
  },
  // GET /api/usuarios/:idUsuario
  async obtener(req: Request, res: Response) {
    res.json(await servicio.obtener(idUsuarioDe(req)));
  },
};
