// disqueria - consultas mongodb
// colecciones: albumes y resenas

use("disqueria");


// 1. indices

// resenas de un album
db.resenas.createIndex({ album_id: 1 });

// filtro por genero
db.albumes.createIndex({ generos: 1 });

// busqueda por titulo
db.albumes.createIndex({ titulo: "text" });


// 2. validacion

// albumes: titulo, artista y generos obligatorios
db.runCommand({
  collMod: "albumes",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "titulo", "artista", "generos"],
      properties: {
        titulo:  { bsonType: "string", minLength: 1 },
        img_url: { bsonType: "string" },
        artista: {
          bsonType: "object",
          required: ["nombre"],
          properties: {
            nombre: { bsonType: "string", minLength: 1 }
          }
        },
        generos: {
          bsonType: "array",
          items: { bsonType: "string" }
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// resenas: puntaje entre 1 y 5
db.runCommand({
  collMod: "resenas",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["album_id", "puntaje", "texto"],
      properties: {
        album_id: { bsonType: "string" },
        puntaje:  { bsonType: ["int", "double"], minimum: 1, maximum: 5 },
        texto:    { bsonType: "string", minLength: 1 }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});


// 3. crud albumes

// crear
db.albumes.insertOne({
  _id: "TEST000001",
  titulo: "Album de prueba",
  img_url: "https://ejemplo.com/portada.jpg",
  artista: { nombre: "Artista de prueba", mbid: null },
  generos: ["Rock", "Pop"]
});

// leer uno
db.albumes.findOne({ _id: "TEST000001" });

// listar (pagina 1, 20 por pagina)
db.albumes.find().sort({ titulo: 1 }).skip(0).limit(20);

// modificar
db.albumes.updateOne(
  { _id: "TEST000001" },
  { $set: { titulo: "Album de prueba (editado)", generos: ["Rock"] } }
);

// eliminar album y sus resenas
db.albumes.deleteOne({ _id: "TEST000001" });
db.resenas.deleteMany({ album_id: "TEST000001" });


// 4. busquedas

// por genero
db.albumes.find({ generos: "Jazz" }).limit(20);

// por palabra en el titulo
db.albumes.find({ $text: { $search: "love" } }).limit(20);

// por artista
db.albumes.find({ "artista.nombre": "Liz Ramirez" });

// resenas de un album
db.resenas.find({ album_id: "1458389375" });


// 5. agregaciones

// cantidad de albumes por genero
db.albumes.aggregate([
  { $unwind: "$generos" },
  { $group: { _id: "$generos", cantidad: { $sum: 1 } } },
  { $sort: { cantidad: -1 } }
]);

// top 10 albumes por puntaje promedio
db.resenas.aggregate([
  { $group: {
      _id: "$album_id",
      puntaje_promedio: { $avg: "$puntaje" },
      cantidad_resenas: { $sum: 1 }
  } },
  { $lookup: {
      from: "albumes",
      localField: "_id",
      foreignField: "_id",
      as: "album"
  } },
  { $unwind: "$album" },
  { $project: {
      _id: 0,
      album_id: "$_id",
      titulo: "$album.titulo",
      artista: "$album.artista.nombre",
      puntaje_promedio: { $round: ["$puntaje_promedio", 2] },
      cantidad_resenas: 1
  } },
  { $sort: { puntaje_promedio: -1, cantidad_resenas: -1 } },
  { $limit: 10 }
]);

// puntaje promedio por genero
db.resenas.aggregate([
  { $lookup: {
      from: "albumes",
      localField: "album_id",
      foreignField: "_id",
      as: "album"
  } },
  { $unwind: "$album" },
  { $unwind: "$album.generos" },
  { $group: {
      _id: "$album.generos",
      puntaje_promedio: { $avg: "$puntaje" },
      cantidad_resenas: { $sum: 1 }
  } },
  { $sort: { puntaje_promedio: -1 } }
]);