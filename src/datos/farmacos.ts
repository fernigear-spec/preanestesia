/**
 * Carga del catálogo de fármacos (datos/farmacos.csv) para la interfaz (paso 8).
 * El CSV se importa como texto con `?raw` (Vite) y se parsea con parseCsv.
 */
import { parseCsv } from './csv.ts';
import csvFarmacos from '../../datos/farmacos.csv?raw';

export interface FarmacoCatalogoUi {
  id: string;
  principiosActivos: string[];
  nombresComerciales: string[];
  grupo: string;
  subgrupo: string;
  pautaTipica: string;
  idRegla: string[];
  requiereConfirmacion: boolean;
  indicacionesPosibles: string[];
  via: 'oral' | 'no_oral';
  /** Texto para el paciente del catálogo, que sobrescribe el de la regla (§3). */
  textoPaciente?: string;
  /** Texto para el anestesiólogo del catálogo (§3). */
  textoAnestesiologo?: string;
}

function lista(v: string | undefined): string[] {
  return (v ?? '').split('|').map((s) => s.trim()).filter(Boolean);
}

export function cargarFarmacos(csvTexto: string = csvFarmacos): FarmacoCatalogoUi[] {
  const { filas } = parseCsv(csvTexto);
  return filas.map((f) => {
    const v = f.valores;
    return {
      id: v.id ?? '',
      principiosActivos: lista(v.principios_activos),
      nombresComerciales: lista(v.nombres_comerciales),
      grupo: v.grupo ?? '',
      subgrupo: v.subgrupo ?? '',
      pautaTipica: v.pauta_tipica ?? 'diaria',
      idRegla: lista(v.id_regla),
      requiereConfirmacion: (v.requiere_confirmacion ?? 'no').trim().toLowerCase() === 'si',
      indicacionesPosibles: lista(v.indicaciones_posibles),
      via: (v.via ?? 'oral').trim().toLowerCase() === 'no_oral' ? 'no_oral' : 'oral',
      ...((v.texto_paciente ?? '').trim() ? { textoPaciente: (v.texto_paciente ?? '').trim() } : {}),
      ...((v.texto_anestesiologo ?? '').trim() ? { textoAnestesiologo: (v.texto_anestesiologo ?? '').trim() } : {}),
    };
  });
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Distancia de edición ≤ 2 (Levenshtein acotada) para tolerar erratas (R3.2.24). */
function distanciaMenorIgual2(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 2) return false;
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + coste);
    }
    prev = cur;
  }
  return (prev[n] ?? 99) <= 2;
}

/**
 * Busca por principio activo o nombre comercial, tolerante a tildes, mayúsculas y
 * erratas menores (distancia ≤ 2 sobre palabras). Devuelve como máximo `limite`.
 */
export function buscarFarmacos(
  catalogo: FarmacoCatalogoUi[],
  consulta: string,
  limite = 20,
): FarmacoCatalogoUi[] {
  const q = normalizar(consulta);
  if (q === '') return [];
  const out: FarmacoCatalogoUi[] = [];
  for (const f of catalogo) {
    const campos = [...f.nombresComerciales, ...f.principiosActivos].map(normalizar);
    const coincide = campos.some((c) => {
      if (c.includes(q)) return true;
      // Erratas: comparar por palabras.
      return c.split(/\s+/).some((palabra) => distanciaMenorIgual2(q, palabra));
    });
    if (coincide) {
      out.push(f);
      if (out.length >= limite) break;
    }
  }
  return out;
}
