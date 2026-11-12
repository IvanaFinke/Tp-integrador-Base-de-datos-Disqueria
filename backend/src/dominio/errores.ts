export class ErrorApp extends Error {
  constructor(public status: number, mensaje: string) {
    super(mensaje);
  }
}
export const noEncontrado = (que: string) => new ErrorApp(404, `${que} no encontrado`);
export const solicitudInvalida = (mensaje: string) => new ErrorApp(400, mensaje);
export const conflicto = (mensaje: string) => new ErrorApp(409, mensaje);
