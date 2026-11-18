// Carga albumes.json y reviews.json en MongoDB. Uso: mongosh database/scripts_nosql/01_importar.js
const fs = require("fs");

const dir =
  (typeof process !== "undefined" && process.env.DATA_DIR) ||
  (fs.existsSync("/data/import/albumes.json") ? "/data/import" : "./database/data/procesada");

const base = db.getSiblingDB("disqueria");
base.albumes.drop();
base.resenas.drop();

function cargar(coleccion, archivo, transformar) {
  const datos = JSON.parse(fs.readFileSync(dir + "/" + archivo, "utf8")).map(transformar);
  const LOTE = 5000;
  for (let i = 0; i < datos.length; i += LOTE) {
    base[coleccion].insertMany(datos.slice(i, i + LOTE), { ordered: false });
  }
  print(`${coleccion}: ${base[coleccion].countDocuments()} documentos`);
}

cargar("albumes", "albumes.json", (a) => ({
  _id: String(a._id ?? a.amazon_id),
  titulo: a.titulo,
  img_url: a.img_url,
  artista: { nombre: a.artista.nombre, mbid: a.artista.mbid },
  generos: a.generos || [],
}));

cargar("resenas", "reviews.json", (r) => ({
  album_id: String(r.album_id),
  reviewer_name: r.reviewer_name,
  puntaje: Number(r.puntaje),
  titulo: r.titulo,
  texto: r.texto,
  fecha: r.fecha,
}));
