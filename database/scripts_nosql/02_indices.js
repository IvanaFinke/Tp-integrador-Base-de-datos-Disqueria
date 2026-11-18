// Índices y validación de esquema en MongoDB
const base = db.getSiblingDB("disqueria");

base.resenas.createIndex({ album_id: 1, fecha: -1 });

base.albumes.createIndex({ generos: 1 });
base.albumes.createIndex({ titulo: 1 });
base.albumes.createIndex({ "artista.nombre": 1 });

base.runCommand({
  collMod: "albumes",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "titulo", "artista", "generos"],
      properties: {
        titulo: { bsonType: "string", minLength: 1 },
        img_url: { bsonType: ["string", "null"] },
        artista: {
          bsonType: "object",
          required: ["nombre", "mbid"],
          properties: { nombre: { bsonType: "string" }, mbid: { bsonType: "string" } },
        },
        generos: { bsonType: "array", items: { bsonType: "string" } },
      },
    },
  },
  validationLevel: "moderate",
});

base.runCommand({
  collMod: "resenas",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["album_id", "puntaje", "texto"],
      properties: {
        album_id: { bsonType: "string" },
        puntaje: { bsonType: ["double", "int"], minimum: 1, maximum: 5 },
        texto: { bsonType: "string" },
      },
    },
  },
  validationLevel: "moderate",
});

print("Índices y validaciones creados");
