/**
 * Provee los módulos de patología al navegador (Vite). Importa todos los JSON de
 * datos/modulos/ en tiempo de compilación y los valida con cargarModulos.
 * (Este fichero solo se usa en la app; las pruebas cargan los JSON con fs.)
 */
import { cargarModulos, type ModuloPatologia } from './modulos.ts';

const objetos = import.meta.glob('../../datos/modulos/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export const MODULOS: ModuloPatologia[] = cargarModulos(objetos);

export const MODULO_POR_ID: Record<string, ModuloPatologia> = Object.fromEntries(
  MODULOS.map((m) => [m.id, m]),
);
