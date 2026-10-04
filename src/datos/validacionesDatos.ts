/**
 * Provee el catálogo de puntos de validación (§13 bis) al navegador (Vite).
 * Importa datos/validaciones.json en tiempo de compilación y lo valida.
 * (Este fichero solo se usa en la app; las pruebas cargan el JSON con fs.)
 */
import { cargarValidaciones, type CatalogoValidaciones } from './validaciones.ts';
import validacionesJson from '../../datos/validaciones.json';

export const VALIDACIONES: CatalogoValidaciones = cargarValidaciones(validacionesJson);
