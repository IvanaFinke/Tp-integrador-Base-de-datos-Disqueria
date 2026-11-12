import cors from "cors";
import express from "express";
import { manejarErrores } from "./middlewares/errores";
import { rutas } from "./rutas";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", rutas);
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(manejarErrores);
