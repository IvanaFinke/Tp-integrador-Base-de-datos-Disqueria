import { Router } from "express";
import { catalogoControlador as cat } from "../controladores/catalogoControlador";
import { favoritoControlador as fav } from "../controladores/favoritoControlador";
import { pedidoControlador as ped } from "../controladores/pedidoControlador";
import { idUsuarioDe } from "../controladores/helpers";
import { pool } from "../db/mysql";
import { mongoDb } from "../db/mongo";
import { noEncontrado } from "../dominio/errores";
import { UsuarioRepository } from "../repositorios/mysql/UsuarioRepository";

export const rutas = Router();

// Estado de cada motor y qué datos maneja
rutas.get("/salud", async (_req, res) => {
  const probar = async (fn: () => Promise<unknown>) => fn().then(() => "ok", (e) => `error: ${e.message}`);
  res.json({
    mysql: { estado: await probar(() => pool.query("SELECT 1")), datos: ["usuarios", "productos", "favoritos", "pedidos"] },
    mongo: { estado: await probar(async () => (await mongoDb()).command({ ping: 1 })), datos: ["albumes", "resenas"] },
  });
});

// Catálogo (MongoDB + precios de MySQL)
rutas.get("/catalogo", cat.listar);
rutas.get("/recomendados", cat.recomendados);
rutas.get("/generos", cat.generos);
rutas.get("/estadisticas/generos", cat.estadisticas);
rutas.post("/albumes", cat.crear);
rutas.get("/albumes/:id", cat.detalle);
rutas.put("/albumes/:id", cat.actualizar);
rutas.delete("/albumes/:id", cat.eliminar);
rutas.get("/albumes/:id/resenias", cat.resenias);

// Usuario y favoritos
rutas.get("/usuarios/:idUsuario", async (req, res) => {
  const u = await new UsuarioRepository().obtener(idUsuarioDe(req));
  if (!u) throw noEncontrado("Usuario");
  res.json(u);
});
rutas.get("/usuarios/:idUsuario/favoritos", fav.listar);
rutas.post("/usuarios/:idUsuario/favoritos", fav.agregar);
rutas.delete("/usuarios/:idUsuario/favoritos", fav.eliminarTodos);
rutas.delete("/usuarios/:idUsuario/favoritos/:albumId", fav.eliminar);

// Pedidos (solo MySQL)
rutas.get("/pedidos", ped.listar);
rutas.post("/pedidos", ped.comprar);
rutas.patch("/pedidos/:id/estado", ped.cambiarEstado);
