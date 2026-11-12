import { Db, MongoClient } from "mongodb";
import { config } from "../config/env";

const cliente = new MongoClient(config.mongo.uri, { serverSelectionTimeoutMS: 5000 });
let conectado: Promise<MongoClient> | null = null;

export async function mongoDb(): Promise<Db> {
  if (!conectado) {
    conectado = cliente.connect().catch((e) => {
      conectado = null;
      throw e;
    });
  }
  return (await conectado).db(config.mongo.db);
}

export async function cerrarMongo() {
  await cliente.close();
}
