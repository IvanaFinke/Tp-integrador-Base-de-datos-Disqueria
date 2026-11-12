import { Request, Response } from "express";
import { PedidoService } from "../servicios/PedidoService";
import { entero } from "../servicios/validaciones";
import { idUsuarioDe } from "./helpers";

const servicio = new PedidoService();

export const pedidoControlador = {
  // GET /api/pedidos            (todos)   |   GET /api/pedidos?usuario=1
  async listar(req: Request, res: Response) {
    const usuario = req.query.usuario ? entero(req.query.usuario, "usuario", 1) : undefined;
    res.json(await servicio.listar(usuario));
  },
  // POST /api/pedidos  { idProducto, cantidad, email, telefono, calle, altura }
  async comprar(req: Request, res: Response) {
    res.status(201).json(await servicio.comprar(idUsuarioDe(req), req.body));
  },
  // PATCH /api/pedidos/:id/estado  { "estado": "pendiente" | "entregado" | "cancelado" }
  async cambiarEstado(req: Request, res: Response) {
    res.json(await servicio.cambiarEstado(entero(req.params.id, "id", 1), req.body?.estado));
  },
};
