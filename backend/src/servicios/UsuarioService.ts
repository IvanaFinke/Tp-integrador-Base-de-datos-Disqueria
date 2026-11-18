import { createHash, timingSafeEqual } from "crypto";
import { ErrorApp, noEncontrado, solicitudInvalida } from "../dominio/errores";
import { UsuarioRepository } from "../repositorios/mysql/UsuarioRepository";

const sha256 = (texto: string) => createHash("sha256").update(texto).digest();

export class UsuarioService {
  constructor(private usuarios = new UsuarioRepository()) {}

  async obtener(idUsuario: number) {
    const usuario = await this.usuarios.obtener(idUsuario);
    if (!usuario) throw noEncontrado("Usuario");
    return usuario;
  }

  // Verifica email y contraseña contra el hash guardado en MySQL.
  async iniciarSesion(body: any) {
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const contrasenia = typeof body?.contrasenia === "string" ? body.contrasenia : "";
    if (!email || !contrasenia) throw solicitudInvalida("Ingresá email y contraseña");

    const usuario = await this.usuarios.obtenerConHash(email);
    const hashGuardado = usuario ? Buffer.from(usuario.hash, "hex") : null;
    const coincide = !!hashGuardado && hashGuardado.length === 32 && timingSafeEqual(hashGuardado, sha256(contrasenia));
    if (!usuario || !coincide) throw new ErrorApp(401, "Email o contraseña incorrectos");

    const { hash: _hash, ...datos } = usuario;
    return datos;
  }
}
