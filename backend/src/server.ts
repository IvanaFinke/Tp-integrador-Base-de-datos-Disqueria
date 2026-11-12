import { app } from "./app";
import { config } from "./config/env";

app.listen(config.puerto, () => {
  console.log(`Backend de la Disquería en http://localhost:${config.puerto}/api`);
});
