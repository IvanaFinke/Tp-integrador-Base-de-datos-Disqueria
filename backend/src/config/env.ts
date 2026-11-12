import "dotenv/config";

export const config = {
  puerto: Number(process.env.PORT ?? 3000),
  usuarioDemo: Number(process.env.USUARIO_DEMO ?? 1),
  mysql: {
    host: process.env.MYSQL_HOST ?? "localhost",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "root",
    database: process.env.MYSQL_DATABASE ?? "disqueria",
  },
  mongo: {
    uri: process.env.MONGO_URI ?? "mongodb://localhost:27017",
    db: process.env.MONGO_DB ?? "disqueria",
  },
};
