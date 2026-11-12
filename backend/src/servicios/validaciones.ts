import { solicitudInvalida } from "../dominio/errores";
import { DatosAlbum, Formato, FORMATOS } from "../dominio/modelos";

const texto = (v: unknown, campo: string, max = 500): string => {
  if (typeof v !== "string" || !v.trim()) throw solicitudInvalida(`El campo '${campo}' es obligatorio`);
  if (v.trim().length > max) throw solicitudInvalida(`El campo '${campo}' supera los ${max} caracteres`);
  return v.trim();
};

export const entero = (v: unknown, campo: string, min: number): number => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min) throw solicitudInvalida(`'${campo}' debe ser un entero mayor o igual a ${min}`);
  return n;
};

export interface DatosAlbumConProducto {
  album: DatosAlbum;
  producto?: { formato: Formato; precio: number; stock: number };
}

export function validarAlbum(body: any, productoObligatorio: boolean): DatosAlbumConProducto {
  if (!body || typeof body !== "object") throw solicitudInvalida("Body inválido");

  const artistaNombre = typeof body.artista === "object" ? body.artista?.nombre : body.artista;
  const imgUrl = body.imgUrl ?? body.img_url ?? null;
  if (imgUrl !== null && (typeof imgUrl !== "string" || (imgUrl.trim() && !/^https?:\/\//i.test(imgUrl.trim())))) {
    throw solicitudInvalida("'imgUrl' debe ser una URL http(s)");
  }
  let generos: unknown = body.generos ?? (body.genero ? [body.genero] : []);
  if (!Array.isArray(generos)) throw solicitudInvalida("'generos' debe ser una lista");
  generos = [...new Set((generos as unknown[]).map((g) => texto(g, "genero", 100)))];
  if (!(generos as string[]).length) throw solicitudInvalida("Indicá al menos un género");

  const album: DatosAlbum = {
    titulo: texto(body.titulo, "titulo"),
    imgUrl: imgUrl?.trim() || null,
    artista: { nombre: texto(artistaNombre, "artista", 255), mbid: body.artista?.mbid },
    generos: generos as string[],
  };

  const hayProducto = body.formato !== undefined || body.precio !== undefined;
  if (!hayProducto && !productoObligatorio) return { album };

  if (!FORMATOS.includes(body.formato)) throw solicitudInvalida(`'formato' debe ser ${FORMATOS.join(" o ")}`);
  const precio = Number(body.precio);
  if (!Number.isFinite(precio) || precio <= 0) throw solicitudInvalida("'precio' debe ser mayor a 0");
  const stock = body.stock === undefined ? 10 : entero(body.stock, "stock", 0);
  return { album, producto: { formato: body.formato, precio: Math.round(precio * 100) / 100, stock } };
}

export interface DatosCompra {
  idProducto: number;
  cantidad: number;
  email: string;
  telefono: string;
  domicilio: string;
}

export function validarCompra(body: any): DatosCompra {
  if (!body || typeof body !== "object") throw solicitudInvalida("Body inválido");
  const errores: Record<string, string> = {};

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.email = "Email inválido";

  const telefono = typeof body.telefono === "string" ? body.telefono.trim() : "";
  if (!/^[0-9+()\-\s]{6,20}$/.test(telefono) || (telefono.match(/\d/g) ?? []).length < 6)
    errores.telefono = "Teléfono inválido";

  const calle = typeof body.calle === "string" ? body.calle.trim() : "";
  if (!calle) errores.calle = "La calle es obligatoria";

  const altura = Number(body.altura);
  if (!Number.isInteger(altura) || altura <= 0 || altura > 99999) errores.altura = "Altura inválida";

  const cantidad = Number(body.cantidad ?? 1);
  if (!Number.isInteger(cantidad) || cantidad < 1) errores.cantidad = "La cantidad debe ser al menos 1";

  const idProducto = Number(body.idProducto);
  if (!Number.isInteger(idProducto) || idProducto < 1) errores.idProducto = "Producto inválido";

  if (Object.keys(errores).length) {
    const e = solicitudInvalida("Hay datos inválidos en el formulario") as any;
    e.errores = errores;
    throw e;
  }
  return { idProducto, cantidad, email, telefono, domicilio: `${calle} ${altura}` };
}
