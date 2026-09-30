/**
 * Cobertura de la codificación de efectos por respuesta (§5.16, decisión del servicio).
 *
 * Cada respuesta de un módulo que genera un efecto clínico (alerta, nota, prueba,
 * clase de riesgo, ASA, regla o dato) debe declararlo en el campo `genera` de su
 * pregunta. Este test falla si una respuesta de §5/§5.16 que sabemos que genera un
 * efecto pierde su codificación, y comprueba que toda entrada `genera` está bien
 * formada. Es el guardián de que la documentación (CONTENIDO_CLINICO.md §16) y el
 * comportamiento del motor no se desincronizan.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../../_harness.ts';
import { cargarModulos, validarModulo, type ModuloPatologia, type PreguntaModulo } from '../../../src/datos/modulos.ts';

const DIR = fileURLToPath(new URL('../../../datos/modulos/', import.meta.url));

function leerModulos(): Record<string, unknown> {
  const objetos: Record<string, unknown> = {};
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.json'))) {
    objetos[`datos/modulos/${f}`] = JSON.parse(readFileSync(DIR + f, 'utf8'));
  }
  return objetos;
}

/**
 * Respuestas de §5/§5.16 que DEBEN llevar codificación de efecto (`genera`).
 * moduloId → lista de preguntaId. Grounded en docs/documento_fuente.md §5.16 y §5.
 */
const RESPUESTAS_CON_EFECTO: Record<string, string[]> = {
  hta: ['control', 'sintomas_mal_control'],
  diabetes: ['hba1c', 'frecuencia_hipoglucemias', 'detecta_hipoglucemias', 'gastroparesia'],
  asma_epoc: [
    'enfermedad', 'crisis_ultimo_mes', 'ingresos_ultimo_anio', 'rescate_semana',
    'desencadenantes', 'oxigeno_domiciliario', 'sintomas_respiratorios_nuevos',
  ],
  deterioro_cognitivo: ['capacidad_consentir', 'episodios_delirio'],
  epilepsia: ['ultima_crisis', 'estatus_previo'],
  parkinson: ['disfagia_saliva', 'ortostatismo'],
  distrofia_muscular: ['tipo', 'insuficiencia_respiratoria', 'ecocardiograma_fecha', 'antecedente_anestesia_grave'],
  esclerosis_multiple: ['ultimo_brote_fecha', 'intolerancia_calor', 'corticoides_3m'],
  lupus: ['organos_afectados', 'trombosis_o_saf', 'anemia_plaquetas', 'corticoides_3m'],
  dermatomiositis_polimiositis: ['debilidad_cervical_disfagia', 'disnea_fatiga', 'problemas_cardiacos', 'corticoides_3m'],
  artritis_reumatoide: ['afectacion_cervical', 'apertura_bucal', 'ronquera_disnea', 'corticoides_3m'],
  enfermedad_inflamatoria_intestinal: ['corticoides_3m'],
  trasplante: ['organo', 'fecha', 'niveles_en_rango', 'infeccion_activa'],
  infeccion_respiratoria: ['sintomas'],
  cardiopatia_isquemica: ['angina_esfuerzo', 'angina_cambio_reciente', 'portador_stent'],
  valvulopatia: ['gravedad', 'protesis', 'sintomas_nuevos'],
  insuficiencia_cardiaca: ['nyha', 'fevi', 'disfuncion_sistolica'],
  enfermedad_renal: ['estadio', 'proteinuria'],
  anemia: ['hemoglobina'],
  saos: ['ronquido_fuerte', 'perimetro_cuello'],
};

function indexar(modulos: ModuloPatologia[]): Map<string, Map<string, PreguntaModulo>> {
  const idx = new Map<string, Map<string, PreguntaModulo>>();
  for (const m of modulos) {
    const preguntas = new Map<string, PreguntaModulo>();
    for (const p of m.preguntas) preguntas.set(p.id, p);
    idx.set(m.id, preguntas);
  }
  return idx;
}

describe('Cobertura de efectos por respuesta (§5.16)', () => {
  it('toda respuesta de §5/§5.16 que genera un efecto declara su codificación en `genera`', () => {
    const modulos = cargarModulos(leerModulos());
    const idx = indexar(modulos);
    const faltantes: string[] = [];
    for (const [moduloId, preguntas] of Object.entries(RESPUESTAS_CON_EFECTO)) {
      const modulo = idx.get(moduloId);
      if (!modulo) {
        faltantes.push(`${moduloId} (módulo ausente)`);
        continue;
      }
      for (const preguntaId of preguntas) {
        const preg = modulo.get(preguntaId);
        if (!preg) {
          faltantes.push(`${moduloId}.${preguntaId} (pregunta ausente)`);
        } else if (!preg.genera || preg.genera.length === 0) {
          faltantes.push(`${moduloId}.${preguntaId} (sin genera)`);
        }
      }
    }
    expect(faltantes).toEqual([]);
  });

  it('todas las entradas `genera` están bien formadas (cuando, efecto, tipo; gravedad si alerta)', () => {
    const modulos = cargarModulos(leerModulos());
    const malformadas: string[] = [];
    const TIPOS = new Set(['alerta', 'nota', 'prueba', 'clase_riesgo', 'asa', 'regla', 'hecho']);
    for (const m of modulos) {
      for (const p of m.preguntas) {
        for (const [i, g] of (p.genera ?? []).entries()) {
          const donde = `${m.id}.${p.id}.genera[${i}]`;
          if (!g.cuando || g.cuando.trim() === '') malformadas.push(`${donde}: cuando vacío`);
          if (!g.efecto || g.efecto.trim() === '') malformadas.push(`${donde}: efecto vacío`);
          if (!TIPOS.has(g.tipo)) malformadas.push(`${donde}: tipo inválido "${g.tipo}"`);
          if (g.tipo === 'alerta' && !g.gravedad) malformadas.push(`${donde}: alerta sin gravedad`);
        }
      }
    }
    expect(malformadas).toEqual([]);
  });

  it('el validador rechaza una alerta sin gravedad', () => {
    const malo = {
      id: 'x', titulo: 'X',
      preguntas: [{ id: 'p1', etiqueta: 'P', tipo: 'boolean', genera: [{ cuando: '= sí', tipo: 'alerta', efecto: 'algo' }] }],
    };
    const errs = validarModulo(malo, 'x.json');
    expect(errs.length).toBeGreaterThan(0);
  });

  it('el validador rechaza un efecto con tipo inválido', () => {
    const malo = {
      id: 'x', titulo: 'X',
      preguntas: [{ id: 'p1', etiqueta: 'P', tipo: 'boolean', genera: [{ cuando: '= sí', tipo: 'inventado', efecto: 'algo' }] }],
    };
    const errs = validarModulo(malo, 'x.json');
    expect(errs.length).toBeGreaterThan(0);
  });
});
