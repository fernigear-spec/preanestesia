/**
 * Construye el contenido estructurado del QR del paciente (§8.16d, §11.1) a partir
 * del plan de medicación ya evaluado. No viaja el estado clínico: solo lo necesario
 * para recalcular (tipo de plazo, duración, horas, adelanto, anticoagulante) y los
 * textos fijos de los fármacos sin plazo (mantener/consultar).
 */
import type { ResultadoFarmaco } from '../../tipos.ts';
import type { ContenidoQrPaciente, FarmacoQr } from './hojaPaciente.ts';
import type { Payload } from './serializar.ts';

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
  // Fármacos sin plazo (mantener/consultar): el texto fijo viaja en el QR para
  // poder renderizarlo sin recalcular.
  if (f.meta.pt === 'sin_plazo') item.tx = r.textoPaciente;
  return item;
}

/** Contenido del QR del paciente (campo `d` del Payload). */
export function construirContenidoQrPaciente(
  plan: FarmacoPlan[],
  telefono: string,
  fechaIntervencion: Date | null,
): ContenidoQrPaciente {
  return {
    tel: telefono,
    fi: fechaIntervencion ? fechaIntervencion.getTime() : null,
    far: plan.map(farmacoQrDesde),
  };
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
