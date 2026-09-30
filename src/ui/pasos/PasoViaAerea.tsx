/**
 * Paso 9 — Vía aérea (§6.2). Recoge Mallampati, apertura bucal, distancia
 * tiromentoniana, movilidad cervical, protrusión mandibular, dentición, perímetro
 * del cuello, barba, ronquido, intubación difícil previa y alertas de vía aérea.
 * Muestra en vivo el EGRI (El-Ganzouri) y Langeron. En modalidad telefónica solo
 * se recoge la anamnesis y la exploración queda pendiente (EGRI parcial).
 */
import { useState } from 'react';
import { calcularEgri, EGRI_UMBRAL_RIESGO, type EntradaEgri } from '../../dominio/escalas/egri.ts';
import { calcularLangeron, LANGERON_UMBRAL_RIESGO } from '../../dominio/escalas/langeron.ts';
import { calcularImc, type DatosViaAereaUi } from '../estadoEntrevista.ts';
import type { Sexo } from '../../dominio/tipos.ts';

interface Props {
  inicial: DatosViaAereaUi | null;
  telefonica: boolean;
  basicos: { edadAnios: number; pesoKg: number; tallaCm: number; sexo: Sexo };
  onContinuar: (datos: DatosViaAereaUi) => void;
  onVolver: () => void;
}

export function PasoViaAerea({ inicial, telefonica, basicos, onContinuar, onVolver }: Props) {
  const [d, setD] = useState<DatosViaAereaUi>(inicial ?? {});
  type Cambios = { [K in keyof DatosViaAereaUi]?: DatosViaAereaUi[K] | undefined };
  const set = (c: Cambios) =>
    setD((x) => {
      const next: DatosViaAereaUi = { ...x };
      for (const [k, val] of Object.entries(c)) {
        if (val === undefined) delete (next as Record<string, unknown>)[k];
        else (next as Record<string, unknown>)[k] = val;
      }
      return next;
    });

  const egriEntrada: EntradaEgri = {
    pesoKg: basicos.pesoKg,
    ...(d.aperturaBucal ? { aperturaBucal: d.aperturaBucal } : {}),
    ...(d.distanciaTiromentoniana ? { distanciaTiromentoniana: d.distanciaTiromentoniana } : {}),
    ...(d.mallampati ? { mallampati: d.mallampati } : {}),
    ...(d.movilidadCervical ? { movilidadCervical: d.movilidadCervical } : {}),
    ...(d.puedeProtruir !== undefined ? { puedeProtruir: d.puedeProtruir } : {}),
    ...(d.intubacionDificilPrevia ? { intubacionDificilPrevia: d.intubacionDificilPrevia } : {}),
  };
  const egri = calcularEgri(egriEntrada);
  const imc = calcularImc(basicos.pesoKg, basicos.tallaCm) ?? 0;
  const langeron = calcularLangeron({
    barba: d.barba === true,
    imc,
    edentulo: d.denticion === 'edentulo',
    edadAnios: basicos.edadAnios,
    ronquido: d.ronquido === true,
  });

  const alertas: string[] = [];
  if (d.radioterapiaCervical) alertas.push('Radioterapia cervical: alerta de vía aérea difícil.');
  if (d.tumorCabezaCuello) alertas.push('Tumor de cabeza y cuello: alerta de vía aérea difícil.');
  if (d.limitacionCervicalReumatologica) alertas.push('Limitación cervical reumatológica: alerta de vía aérea difícil.');
  if (d.intubacionDificilPrevia === 'confirmado') alertas.push('Intubación difícil previa confirmada: alerta.');

  return (
    <section className="tarjeta" aria-labelledby="paso9-tit">
      <h2 id="paso9-tit">Paso 9 · Vía aérea</h2>
      {telefonica && (
        <p className="aviso aviso-info" role="note">
          Entrevista telefónica: la exploración de la vía aérea queda <strong>pendiente de explorar el día de la intervención</strong>. El EGRI es parcial.
        </p>
      )}

      {!telefonica && (
        <>
          <Selector label="Mallampati" valor={d.mallampati ? String(d.mallampati) : ''} onChange={(v) => set({ mallampati: (v ? Number(v) : undefined) as DatosViaAereaUi['mallampati'] })}
            opciones={[['1', 'I'], ['2', 'II'], ['3', 'III'], ['4', 'IV']]} />
          <Selector label="Apertura bucal" valor={d.aperturaBucal ?? ''} onChange={(v) => set({ aperturaBucal: (v || undefined) as DatosViaAereaUi['aperturaBucal'] })}
            opciones={[['ge_4', '≥ 4 cm (tres dedos)'], ['lt_4', '< 4 cm']]} />
          <Selector label="Distancia tiromentoniana" valor={d.distanciaTiromentoniana ?? ''} onChange={(v) => set({ distanciaTiromentoniana: (v || undefined) as DatosViaAereaUi['distanciaTiromentoniana'] })}
            opciones={[['gt_6_5', '> 6,5 cm'], ['6_a_6_5', '6 a 6,5 cm'], ['lt_6', '< 6 cm']]} />
          <Selector label="Movilidad cervical" valor={d.movilidadCervical ?? ''} onChange={(v) => set({ movilidadCervical: (v || undefined) as DatosViaAereaUi['movilidadCervical'] })}
            opciones={[['gt_90', '> 90°'], ['80_a_90', '80 a 90°'], ['lt_80', '< 80°']]} />
          <BotonesSiNo label="¿Puede adelantar la mandíbula (protrusión)?" valor={d.puedeProtruir} onChange={(v) => set({ puedeProtruir: v })} />
          <Selector label="Dentición" valor={d.denticion ?? ''} onChange={(v) => set({ denticion: (v || undefined) as DatosViaAereaUi['denticion'] })}
            opciones={[['completa', 'Completa'], ['piezas_moviles', 'Piezas móviles'], ['protesis_removible', 'Prótesis removible'], ['protesis_fija', 'Prótesis fija'], ['edentulo', 'Edéntulo']]} />
          <div className="campo">
            <label htmlFor="perimetro">Perímetro del cuello (cm)</label>
            <input id="perimetro" type="number" min={20} max={70} value={d.perimetroCuello ?? ''} onChange={(e) => set({ perimetroCuello: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
        </>
      )}

      <BotonesSiNo label="Barba" valor={d.barba} onChange={(v) => set({ barba: v })} />
      <BotonesSiNo label="Ronquido" valor={d.ronquido} onChange={(v) => set({ ronquido: v })} />
      <Selector label="Intubación difícil previa" valor={d.intubacionDificilPrevia ?? ''} onChange={(v) => set({ intubacionDificilPrevia: (v || undefined) as DatosViaAereaUi['intubacionDificilPrevia'] })}
        opciones={[['no', 'No'], ['dudoso', 'Dudosa'], ['confirmado', 'Confirmada']]} />
      <BotonesSiNo label="Radioterapia cervical" valor={d.radioterapiaCervical} onChange={(v) => set({ radioterapiaCervical: v })} />
      <BotonesSiNo label="Tumor de cabeza y cuello" valor={d.tumorCabezaCuello} onChange={(v) => set({ tumorCabezaCuello: v })} />
      <BotonesSiNo label="Limitación cervical reumatológica" valor={d.limitacionCervicalReumatologica} onChange={(v) => set({ limitacionCervicalReumatologica: v })} />

      <div className="resultado-motor aviso-info" aria-live="polite">
        EGRI{telefonica ? ' (parcial)' : ''}: <strong>{egri.puntuacion}</strong> · {egri.puntuacion >= EGRI_UMBRAL_RIESGO ? 'riesgo elevado de laringoscopia difícil' : 'sin riesgo elevado'}
        {' · '}Langeron: <strong>{langeron.puntuacion}</strong> · {langeron.puntuacion >= LANGERON_UMBRAL_RIESGO ? 'riesgo de ventilación difícil' : 'sin riesgo aumentado'}
      </div>
      {alertas.map((a, i) => (
        <p key={i} className="aviso aviso-atencion" role="note">{a}</p>
      ))}

      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={onVolver}>Volver</button>
        <button type="button" className="boton-primario" onClick={() => onContinuar(d)}>Continuar</button>
      </div>
    </section>
  );
}

function Selector({ label, valor, onChange, opciones }: { label: string; valor: string; onChange: (v: string) => void; opciones: Array<[string, string]> }) {
  return (
    <div className="campo">
      <label>{label}</label>
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">— elija —</option>
        {opciones.map(([v, et]) => <option key={v} value={v}>{et}</option>)}
      </select>
    </div>
  );
}

function BotonesSiNo({ label, valor, onChange }: { label: string; valor: boolean | undefined; onChange: (v: boolean | undefined) => void }) {
  return (
    <div className="campo">
      <label>{label}</label>
      <div className="grupo-si-no">
        <button type="button" className={`chip-hora ${valor === true ? 'seleccionado' : ''}`} onClick={() => onChange(valor === true ? undefined : true)}>Sí</button>
        <button type="button" className={`chip-hora ${valor === false ? 'seleccionado' : ''}`} onClick={() => onChange(valor === false ? undefined : false)}>No</button>
      </div>
    </div>
  );
}
