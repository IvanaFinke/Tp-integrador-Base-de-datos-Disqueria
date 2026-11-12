import { Request, Response } from "express";
import { CatalogoService } from "../servicios/CatalogoService";
import { validarAlbum } from "../servicios/validaciones";
import { idUsuarioDe, numeroQuery, ordenQuery } from "./helpers";

const servicio = new CatalogoService();
const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export const catalogoControlador = {
  // GET /api/catalogo?texto=&genero=&orden=asc|desc&pagina=1&tamanio=24
  async listar(req: Request, res: Response) {
    const { texto: t, genero, orden, pagina, tamanio } = req.query;
    res.json(
      await servicio.listar(
        { texto: texto(t), genero: texto(genero) },
        ordenQuery(orden),
        numeroQuery(pagina, 1, 100000),
        numeroQuery(tamanio, 24, 100)
      )
    );
  },

  // GET /api/recomendados?orden=asc|desc&limite=24
  async recomendados(req: Request, res: Response) {
    res.json(await servicio.recomendados(idUsuarioDe(req), ordenQuery(req.query.orden), numeroQuery(req.query.limite, 24, 100)));
  },

  // GET /api/albumes/:id
  async detalle(req: Request, res: Response) {
    res.json(await servicio.detalle(String(req.params.id)));
  },

  // GET /api/albumes/:id/resenias
  async resenias(req: Request, res: Response) {
    res.json(await servicio.resenias(String(req.params.id)));
  },

  // POST /api/albumes
  async crear(req: Request, res: Response) {
    res.status(201).json(await servicio.crear(validarAlbum(req.body, true)));
  },

  // PUT /api/albumes/:id
  async actualizar(req: Request, res: Response) {
    res.json(await servicio.actualizar(String(req.params.id), validarAlbum(req.body, false)));
  },

  // DELETE /api/albumes/:id
  async eliminar(req: Request, res: Response) {
    await servicio.eliminar(String(req.params.id));
    res.status(204).end();
  },

  // GET /api/generos
  async generos(_req: Request, res: Response) {
    res.json(await servicio.generos());
  },

  // GET /api/estadisticas/generos?limite=10
  async estadisticas(req: Request, res: Response) {
    res.json(await servicio.estadisticasPorGenero(numeroQuery(req.query.limite, 10, 100)));
  },
};
