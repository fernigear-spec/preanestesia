/**
 * Serialización de QR/enlaces sin servidor — docs/documento_fuente.md §11 (caso 19).
 * Los datos viajan tras '#' en la URL. Se serializan (JSON compacto con claves
 * cortas), se comprimen con CompressionStream('deflate-raw') —nativo en Node 22 y
 * navegadores— y se codifican en base64url. La caducidad es una regla de
 * visualización (no cifrado). La generación de la IMAGEN del QR queda para la
 * fase de interfaz.
 */

export type TipoPayload = 'paciente' | 'anestesiologo';

/** Envoltura común de la carga útil (claves cortas para que quepa en el QR). */
export interface Payload {
  /** tipo. */
  t: TipoPayload;
  /** versión del esquema. */
  e: number;
  /** versión del contenido clínico. */
  v: string;
  /** fecha de creación (epoch ms). */
  c: number;
  /** fecha de caducidad (epoch ms). */
  x: number;
  /** datos (estructura libre; para paciente: hoja calculada estructurada). */
  d: unknown;
}

// —————————————————— base64url ——————————————————

function bytesABase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlABytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// —————————————————— compresión (streams nativos) ——————————————————

async function comprimir(texto: string): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  void writer.write(new TextEncoder().encode(texto));
  void writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}

async function descomprimir(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  // Copia a un ArrayBuffer propio para satisfacer BufferSource (no SharedArrayBuffer).
  const ab = new ArrayBuffer(bytes.length);
  const copia = new Uint8Array(ab);
  copia.set(bytes);
  void writer.write(copia);
  void writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder().decode(buf);
}

// —————————————————— API pública ——————————————————

/** Serializa un payload a cadena base64url comprimida (lo que va tras '#'). */
export async function serializar(p: Payload): Promise<string> {
  const json = JSON.stringify(p);
  const comprimido = await comprimir(json);
  return bytesABase64Url(comprimido);
}

export type ResultadoDeserializacion =
  | { estado: 'ok'; payload: Payload; avisoVersion: boolean }
  | { estado: 'caducado' }
  | { estado: 'invalido' };

/**
 * Deserializa una cadena de QR/enlace.
 * @param cadena base64url comprimida.
 * @param ahora fecha actual (para caducidad).
 * @param versionContenidoActual versión del contenido en uso (para aviso de versión).
 */
export async function deserializar(
  cadena: string,
  ahora: Date,
  versionContenidoActual: string,
): Promise<ResultadoDeserializacion> {
  let payload: Payload;
  try {
    const bytes = base64UrlABytes(cadena);
    const json = await descomprimir(bytes);
    payload = JSON.parse(json) as Payload;
  } catch {
    return { estado: 'invalido' };
  }
  if (typeof payload?.x !== 'number' || typeof payload?.t !== 'string') {
    return { estado: 'invalido' };
  }
  // Caducidad: regla de visualización (§11).
  if (ahora.getTime() > payload.x) {
    return { estado: 'caducado' };
  }
  const avisoVersion = payload.v !== versionContenidoActual;
  return { estado: 'ok', payload, avisoVersion };
}

/** Capacidad práctica de un QR (bytes) con corrección media/baja (§11.3). */
export const QR_CAPACIDAD_BYTES = 2900;

/** ¿Cabe la cadena serializada en un QR? Si no, la app ofrece copiar el enlace. */
export function cabeEnQr(cadenaBase64Url: string): boolean {
  return cadenaBase64Url.length <= QR_CAPACIDAD_BYTES;
}
