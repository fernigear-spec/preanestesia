/**
 * Construye el contenido estructurado del QR del paciente (§8.16d, §11.1) a partir
 * del plan de medicación ya evaluado. No viaja el estado clínico: solo lo necesario
 * para recalcular (tipo de plazo, duración, horas, adelanto, anticoagulante) y los
 * textos fijos de los fármacos sin plazo (mantener/consultar).
 */
import type { ResultadoFarmaco } from '../../tipos.ts';
import type { ContenidoQrPaciente, FarmacoQr, AyunoQr, ExtrasHojaQr } from './hojaPaciente.ts';
import type { Payload } from './serializar.ts';
import type { PlanAyuno } from '../../ayuno/ayuno.ts';

/** Metadatos de plazo de un fármaco (los aporta el despachador: metadatosPlazo). */
export interface MetaPlazo {
  pt: 'dias' | 'horas' | 'no_dia_iq' | 'sin_plazo';
  pd?: number;
  ad: boolean;
  ac: boolean;
}

/** Un fármaco del plan, con su resultado evaluado, sus horas y sus metadatos de plazo. */
export interface FarmacoPlan {
  resultado: ResultadoFarmaco;
  horas: string[];
  meta: MetaPlazo;
  /** Variante de «mantener» para localizar la instrucción (oral/no_oral/inhalador/colirio). */
  variante?: 'oral' | 'no_oral' | 'inhalador' | 'colirio';
}

/** Construye un FarmacoQr a partir de un fármaco del plan. */
export function farmacoQrDesde(f: FarmacoPlan): FarmacoQr {
  const r = f.resultado;
  const item: FarmacoQr = {
    n: r.nombreComercial,
    pt: f.meta.pt,
    hh: f.horas,
    ad: f.meta.ad,
    ac: f.meta.ac,
    rc: r.requiereConfirmacion,
  };
  if (f.meta.pd !== undefined) item.pd = f.meta.pd;
  if (r.confirmadoPor) item.cf = r.confirmadoPor;
  // Fármacos sin plazo (mantener/consultar): el texto fijo viaja en el QR (para el
  // castellano) y, si es «mantener», también su variante (para localizar en catalán).
  if (f.meta.pt === 'sin_plazo') item.tx = r.textoPaciente;
  if (r.accion === 'mantener' && f.variante) item.mv = f.variante;
  return item;
}

/** Construye el ayuno del QR (§8.14) a partir del plan de ayuno y su situación. */
export function ayunoQrDesde(ayuno: PlanAyuno, pediatrico: boolean, situacion: string): AyunoQr {
  return {
    ped: pediatrico,
    sit: situacion,
    ln: ayuno.lineas.map((l) => (l.rangoHorasAntes !== undefined
      ? { c: l.codigo, ha: l.horasAntes, hf: l.rangoHorasAntes }
      : { c: l.codigo, ha: l.horasAntes })),
  };
}

/** Contenido del QR del paciente (campo `d` del Payload). */
export function construirContenidoQrPaciente(
  plan: FarmacoPlan[],
  telefono: string,
  fechaIntervencion: Date | null,
  ayuno?: AyunoQr,
  extras?: ExtrasHojaQr,
): ContenidoQrPaciente {
  const contenido: ContenidoQrPaciente = {
    tel: telefono,
    fi: fechaIntervencion ? fechaIntervencion.getTime() : null,
    far: plan.map(farmacoQrDesde),
  };
  if (ayuno) contenido.ay = ayuno;
  if (extras) contenido.ex = extras;
  return contenido;
}

/** Envuelve el contenido del paciente en un Payload listo para serializar (§11). */
export function payloadPaciente(
  contenido: ContenidoQrPaciente,
  versionContenido: string,
  creacion: Date,
  caducidad: number,
  versionEsquema = 1,
): Payload {
  return {
    t: 'paciente',
    e: versionEsquema,
    v: versionContenido,
    c: creacion.getTime(),
    x: caducidad,
    d: contenido,
  };
}
