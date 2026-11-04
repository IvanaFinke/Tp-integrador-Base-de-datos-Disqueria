// consultas de mongodb
// base: disqueria
// colecciones: albumes, reseñas
use("disqueria");

// 1. indices
db.resenas.createIndex({ album_id: 1 });      // reseñas de un álbum
db.albumes.createIndex({ generos: 1 });       // filtro por gen
db.albumes.createIndex({ titulo: "text" });   // busco x tiutlo 


// 2. crud de albumes
// C - crear un album
db.albumes.insertOne({
  _id: "TEST000001",
  titulo: "album de prueba",
  img_url: "https://ejemplo.com/portada.jpg",
  artista: { nombre: "Artista de prueba", mbid: null },
  generos: ["Rock", "Pop"]
});

// R - leer un album por su id
db.albumes.findOne({ _id: "TEST000001" });

// R - listar albumes (catlogo paginado: pag 1, 20 por pag)
db.albumes.find().sort({ titulo: 1 }).skip(0).limit(20);

// U - modificar un album
db.albumes.updateOne(
  { _id: "TEST000001" },
  { $set: { titulo: "album de prueba (editado)", generos: ["Rock"] } }
);

// D - eliminar un album y sus reseñas
db.albumes.deleteOne({ _id: "TEST000001" });
db.resenas.deleteMany({ album_id: "TEST000001" });

// 3. busquedas del catalgo

// Filtrar por genero (busca dentro del arreglo generos)
db.albumes.find({ generos: "Jazz" }).limit(20);

// buscar por palabra en el titulo (usa el indice de texto)
db.albumes.find({ $text: { $search: "love" } }).limit(20);

// buscar por artista (campo embebido)
db.albumes.find({ "artista.nombre": "Liz Ramirez" });

// reseñas de un album
db.resenas.find({ album_id: "1458389375" });

// 4. consultas con agregaciones
// 4.1 cant de albumes por genero 
db.albumes.aggregate([
  { $unwind: "$generos" },
  { $group: { _id: "$generos", cantidad: { $sum: 1 } } },
  { $sort: { cantidad: -1 } }
]);

// 4.2 puntaje promedio por album, con los datos del album
//     (une reseñas con albumes mediante $lookup)
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

// 4.3 puntaje promedio por genero
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