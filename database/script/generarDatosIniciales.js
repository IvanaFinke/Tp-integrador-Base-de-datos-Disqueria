// Genera datos_iniciales.sql (usuarios, productos, favoritos y pedidos) a partir de albumes.json.
// Uso: node database/script/generarDatosIniciales.js [--limite N]
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const raiz = path.resolve(__dirname, "..", "..");
const argLimite = process.argv.indexOf("--limite");
const LIMITE = argLimite > -1 ? Number(process.argv[argLimite + 1]) : Infinity;
const DIR = process.env.DATA_DIR || path.join(raiz, "database", "data", "procesada");
const SALIDA = process.env.SALIDA || path.join(raiz, "database", "datos_iniciales.sql");
const LOTE = 1000;

const esc = (v) => (typeof v === "number" ? String(v) : "'" + String(v).replace(/\\/g, "\\\\").replace(/'/g, "''") + "'");
// Número pseudoaleatorio estable: el mismo álbum siempre da el mismo precio y stock.
const azar = (texto) => parseInt(crypto.createHash("md5").update(texto).digest("hex").slice(0, 8), 16) / 0xffffffff;

function insertarEnLotes(out, tabla, columnas, filas) {
  for (let i = 0; i < filas.length; i += LOTE) {
    const lote = filas.slice(i, i + LOTE).map((f) => "(" + f.map(esc).join(",") + ")");
    out.push(`INSERT INTO ${tabla} (${columnas.join(",")}) VALUES\n${lote.join(",\n")};`);
  }
}

const ids = [
  ...new Set(
    JSON.parse(fs.readFileSync(path.join(DIR, "albumes.json"), "utf8"))
      .map((a) => String(a._id ?? a.amazon_id))
      .filter(Boolean)
  ),
].slice(0, LIMITE);

// Cada álbum se vende en CD; el 60% también en vinilo (1,8 veces el precio del CD).
const productos = [];
for (const id of ids) {
  const base = Math.round((8000 + azar(id + "precio") * 17000) / 100) * 100;
  productos.push([id, "CD", base, Math.floor(azar(id + "stockcd") * 40)]);
  if (azar(id + "vinilo") < 0.6) {
    productos.push([id, "Vinilo", Math.round((base * 1.8) / 100) * 100, Math.floor(azar(id + "stockvin") * 15)]);
  }
}

const hash = (p) => crypto.createHash("sha256").update(p).digest("hex");
const usuarios = [
  [1, "Usuario Demo", "demo@disqueria.com", hash("demo1234")],
  [2, "Meel", "meel@disqueria.com", hash("demo1234")],
  [3, "Luz", "luz@disqueria.com", hash("demo1234")],
];

const out = ["SET NAMES utf8mb4;", "USE disqueria;"];
insertarEnLotes(out, "usuario", ["id_usuario", "nombre", "email", "contrasenia_hash"], usuarios);
insertarEnLotes(out, "producto", ["amazon_id", "formato", "precio", "stock"], productos);

// Favoritos y pedidos de ejemplo
insertarEnLotes(out, "favorito", ["id_usuario", "amazon_id"], ids.slice(0, 4).map((id) => [1, id]));
const pedidos = [
  [1, 0, 2, "entregado", "demo@disqueria.com", "11-4445-7753", "Los Cerros 2432"],
  [2, 1, 1, "pendiente", "meel@disqueria.com", "11-5555-1234", "Av. 25 de Mayo 1021"],
  [3, 2, 3, "cancelado", "luz@disqueria.com", "11-6666-9876", "Mitre 3550"],
];
for (const [usuario, offset, cantidad, estado, email, tel, dom] of pedidos) {
  out.push(`INSERT INTO pedido (id_usuario, id_producto, cantidad, precio_unitario, estado, email_contacto, telefono_contacto, domicilio_envio)
SELECT ${usuario}, id_producto, ${cantidad}, precio, '${estado}', '${email}', '${tel}', '${dom}' FROM producto ORDER BY id_producto LIMIT 1 OFFSET ${offset};`);
}

fs.writeFileSync(SALIDA, out.join("\n") + "\n", "utf8");
console.log("Archivo generado:", SALIDA, { usuarios: usuarios.length, productos: productos.length });
