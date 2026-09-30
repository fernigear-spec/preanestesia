/**
 * Renderizado de las instrucciones del paciente en castellano o catalán a partir
 * de datos estructurados y de las plantillas de textosPaciente. Sin texto redactado
 * fijo: todo se compone aquí, de modo que la vista en catalán no muestre castellano.
 */
import type { InstruccionPacienteEstructurada } from '../../dominio/salidas/qr/hojaPaciente.ts';
import type { AyunoQr } from '../../dominio/salidas/qr/hojaPaciente.ts';
import type { TextosPaciente } from './textosPaciente.ts';

function rellenar(plantilla: string, vars: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function fechaLarga(epoch: number, t: TextosPaciente): string {
  const d = new Date(epoch);
  return `${t.dias_semana[d.getDay()]} ${d.getDate()} de ${t.meses[d.getMonth()]}`;
}
export function horaReloj(epoch: number): string {
  const d = new Date(epoch);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Texto localizado de una instrucción de medicación. */
export function renderMed(instr: InstruccionPacienteEstructurada, t: TextosPaciente, telefono: string): string {
  const m = t.med;
  const e = instr.e;
  switch (e.k) {
    case 'confirmacion':
      return rellenar(m.confirmacion, { n: instr.nombre });
    case 'no_cumplible':
      return rellenar(m.no_cumplible, { n: instr.nombre, tel: telefono });
    case 'mantener':
      return m[`mantener_${e.mv}` as 'mantener_oral'];
    case 'texto_fijo':
      // El texto libre solo existe en castellano; en catalán se usa el genérico
      // (§10.2, punto 4: la vista en catalán no muestra castellano).
      return t.idioma === 'ca' ? m.otro : e.tx;
    case 'no_dia_iq':
      return m.no_dia_iq;
    case 'margen':
      return e.margen.tipo === 'dias'
        ? rellenar(m.margen_dias, { n: e.margen.n })
        : rellenar(m.margen_horas, { n: e.margen.n });
    case 'suspender': {
      const fecha = fechaLarga(e.fecha, t);
      const hora = horaReloj(e.fecha);
      const base = e.adelantada && e.horaOriginal
        ? rellenar(m.suspender_adelantada, { fecha, hora, horaOriginal: e.horaOriginal })
        : rellenar(m.suspender_normal, { fecha, hora });
      const coletilla = e.margen.tipo === 'dias'
        ? rellenar(m.coletilla_dias, { n: e.margen.n })
        : rellenar(m.coletilla_horas, { n: e.margen.n });
      return `${base}${coletilla}`;
    }
  }
}

export interface LineaAyunoRender {
  etiqueta: string;
  cuando: string;
}

/** Líneas de ayuno localizadas, con horas de reloj si hay fecha o «h antes» si no. */
export function renderAyuno(ay: AyunoQr, fecha: number | null, t: TextosPaciente): LineaAyunoRender[] {
  const a = t.ayuno;
  return ay.ln.map((l) => {
    const etiqueta = a.labels[l.c as 'comida_copiosa'] ?? l.c;
    let cuando: string;
    if (l.ha === 0 && l.hf === undefined) {
      cuando = a.sin_hora;
    } else if (fecha !== null) {
      if (l.hf !== undefined) {
        cuando = rellenar(a.rango, { a: horaReloj(fecha - l.hf * 3_600_000), b: horaReloj(fecha - l.ha * 3_600_000) });
      } else {
        cuando = rellenar(a.hasta, { hora: horaReloj(fecha - l.ha * 3_600_000) });
      }
    } else if (l.hf !== undefined) {
      cuando = rellenar(a.rango_antes, { a: l.ha, b: l.hf });
    } else {
      cuando = rellenar(a.antes, { n: l.ha });
    }
    return { etiqueta, cuando };
  });
}
