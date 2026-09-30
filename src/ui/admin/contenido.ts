/**
 * Registro de los ficheros de contenido editables desde el panel de administración
 * (§14.1). Se cargan en crudo (texto) en tiempo de compilación con Vite, para poder
 * mostrarlos, editarlos, validarlos y descargarlos. El panel NO escribe en GitHub:
 * solo genera el fichero corregido para subirlo a mano.
 */
export type TipoFichero = 'csv' | 'json' | 'modulo' | 'texto';

export interface FicheroContenido {
  /** Identificador único (la ruta relativa a la raíz del repositorio). */
  id: string;
  /** Ruta para mostrar, p. ej. "datos/farmacos.csv". */
  ruta: string;
  /** Nombre del fichero para la descarga, p. ej. "farmacos.csv". */
  nombre: string;
  tipo: TipoFichero;
  /** Contenido publicado (el que hay ahora en el repositorio). */
  publicado: string;
}

const csvs = import.meta.glob('../../../datos/*.csv', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const jsons = import.meta.glob('../../../datos/*.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const modulos = import.meta.glob('../../../datos/modulos/*.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const textos = import.meta.glob('../../../datos/textos/**/*.json', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Convierte la clave del glob ('../../../datos/x') en la ruta 'datos/x'. */
function aRuta(clave: string): string {
  return clave.replace(/^(\.\.\/)+/, '');
}

function construir(mapa: Record<string, string>, tipo: TipoFichero): FicheroContenido[] {
  return Object.entries(mapa).map(([clave, publicado]) => {
    const ruta = aRuta(clave);
    return { id: ruta, ruta, nombre: ruta.split('/').pop() ?? ruta, tipo, publicado };
  });
}

// Orden: CSV primero, luego los JSON principales, después módulos y textos.
export const FICHEROS: FicheroContenido[] = [
  ...construir(csvs, 'csv').sort((a, b) => a.ruta.localeCompare(b.ruta)),
  ...construir(jsons, 'json').sort((a, b) => a.ruta.localeCompare(b.ruta)),
  ...construir(modulos, 'modulo').sort((a, b) => a.ruta.localeCompare(b.ruta)),
  ...construir(textos, 'texto').sort((a, b) => a.ruta.localeCompare(b.ruta)),
];
