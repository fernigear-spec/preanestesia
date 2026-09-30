/**
 * Construye el plan de medicación del paciente (FarmacoPlan[]) reevaluando la
 * medicación del paso 8 con el motor, para alimentar el QR y la hoja del paciente.
 * Como el QR solo guarda el tipo de plazo, la duración, el adelanto y si es
 * anticoagulante (no fechas), para obtener «requiere confirmación» y el texto de
 * los fármacos «mantener/consultar» se evalúa con una fecha de referencia (la de la
 * intervención si se conoce, o una futura); las fechas concretas las recalcula
 * después la vista del paciente.
 */
import type { DatosIntervencion } from '../../dominio/tipos.ts';
import { construirContexto } from '../../dominio/reglas/motor.ts';
import { evaluarCombinacionUi, metadatosPlazo, type DatosFarmacoUi } from '../../dominio/reglas/despachador.ts';
import type { DatosClinicos } from '../../dominio/entrevista/hechosClinicos.ts';
import type { FarmacoPlan } from '../../dominio/salidas/qr/construirContenido.ts';
import type { FarmacoTomadoUi } from '../estadoEntrevista.ts';

const MS_DIA = 86_400_000;

function proximaDosisSemanal(diaSemana: number, intervencion: Date): Date {
  const d = new Date(intervencion);
  for (let i = 0; i < 8; i++) {
    if (d.getDay() === diaSemana) break;
    d.setDate(d.getDate() - 1);
  }
  d.setHours(9, 0, 0, 0);
  return d;
}

export function construirPlanPaciente(
  medicacion: FarmacoTomadoUi[],
  intervencion: DatosIntervencion,
  clin: DatosClinicos,
  pesoKg: number,
): FarmacoPlan[] {
  // Fecha de referencia para extraer "requiere confirmación" y textos fijos.
  const refFecha = intervencion.fechaHora ?? new Date(Date.now() + 90 * MS_DIA);
  const ctx = construirContexto({ ...intervencion, fechaHora: refFecha, fechaDesconocida: false }, pesoKg, clin.aclaramiento);

  return medicacion.map((f) => {
    const datos: DatosFarmacoUi = {
      idFarmaco: f.idFarmaco,
      nombreComercial: f.nombreComercial,
      principiosActivos: f.principiosActivos,
      idRegla: f.idRegla,
      via: f.via,
      horas: f.horas,
      ...(f.dosisMg !== undefined ? { dosisMg: f.dosisMg } : {}),
      ...(f.diaSemana !== undefined ? { proximaDosisSemanal: proximaDosisSemanal(f.diaSemana, refFecha) } : {}),
      ...(f.fechaUltimaDosis ? { fechaUltimaDosis: new Date(`${f.fechaUltimaDosis}T00:00`) } : {}),
      ...(f.periodicidadDias !== undefined ? { periodicidadDias: f.periodicidadDias } : {}),
      ...(f.insulinaBasalUi !== undefined ? { insulinaBasalUi: f.insulinaBasalUi } : {}),
      ...(f.insulinaNocheUi !== undefined ? { insulinaNocheUi: f.insulinaNocheUi } : {}),
      ...(f.insulinaMananaUi !== undefined ? { insulinaMananaUi: f.insulinaMananaUi } : {}),
      ...(f.tipoHbpm ? { tipoHbpm: f.tipoHbpm } : {}),
      ...(f.requiereConfirmacionCatalogo ? { requiereConfirmacionCatalogo: true } : {}),
      ...(f.textoPaciente ? { textoPacienteOverride: f.textoPaciente } : {}),
      ...(f.textoAnestesiologo ? { textoAnestesiologoOverride: f.textoAnestesiologo } : {}),
    };
    const resultado = evaluarCombinacionUi(datos, f.idReglas, ctx, clin);
    const meta = metadatosPlazo(f.idRegla, f.dosisMg, f.tipoHbpm);
    return { resultado, horas: f.horas, meta };
  });
}
