/**
 * Bloque del resumen que gestiona los puntos pendientes de confirmación (§12) y,
 * solo cuando no queda ninguno sin resolver, permite generar la hoja y el QR.
 * Deriva los hechos clínicos, el ayuno (§8.14) y los condicionales de la hoja
 * (§10.2) a partir de la entrevista.
 */
import { useMemo, useState } from 'react';
import type { DatosIntervencion, Sexo } from '../../dominio/tipos.ts';
import { derivarHechosClinicos } from '../../dominio/entrevista/hechosClinicos.ts';
import { derivarHojaExtras } from '../../dominio/entrevista/hojaExtras.ts';
import { derivarPuntosValidacion } from '../../dominio/entrevista/puntosValidacion.ts';
import { VALIDACIONES } from '../../datos/validacionesDatos.ts';
import { MODULOS } from '../../datos/modulosDatos.ts';
import { construirContexto } from '../../dominio/reglas/motor.ts';
import { evaluarStent } from '../../dominio/reglas/antiagregantes.ts';
import { calcularAyuno } from '../../dominio/ayuno/ayuno.ts';
import { ayunoQrDesde } from '../../dominio/salidas/qr/construirContenido.ts';
import { calcularAuditC } from '../../dominio/escalas/auditC.ts';
import { calcular4AT } from '../../dominio/escalas/cuatroAT.ts';
import type { ConsentimientoUi, CribadoUi, DatosBasicosUi, FarmacoTomadoUi, HabitosUi } from '../estadoEntrevista.ts';
import { construirPlanPaciente } from './construirPlanUi.ts';
import { HojaPaciente } from './HojaPaciente.tsx';

const MS_DIA = 86_400_000;
const EDAD_PEDIATRICA_MAXIMA = 17;

interface Props {
  medicacion: FarmacoTomadoUi[];
  intervencion: DatosIntervencion;
  basicos: DatosBasicosUi;
  cribado: CribadoUi;
  habitos: HabitosUi | null;
  consentimiento: ConsentimientoUi | null;
  /** "Hoy" para el plazo no alcanzable; la UI pasa la real, el modo entrenamiento una fija. */
  fechaReferencia?: Date;
}

const CONS_MAP: Record<ConsentimientoUi['estado'], 'entregado' | 'pendiente' | 'no_procede'> = {
  entregado: 'entregado',
  pendiente_entregar: 'pendiente',
  no_procede: 'no_procede',
};

export function BloqueHojaPaciente({ medicacion, intervencion, basicos, cribado, habitos, consentimiento, fechaReferencia }: Props) {
  const [generar, setGenerar] = useState(false);
  const hoy = fechaReferencia ?? new Date();

  const sexo: Sexo = basicos.sexo;
  const clin = useMemo(
    () => derivarHechosClinicos({
      respuestas: cribado.respuestasModulos,
      enfermedades: new Set(cribado.enfermedades),
      medicacion: medicacion.map((f) => ({ principiosActivos: f.principiosActivos, idRegla: f.idRegla })),
      edadAnios: basicos.edadAnios,
      pesoKg: basicos.pesoKg,
      sexo,
      fechaIntervencion: intervencion.fechaHora,
      espacioCerrado: intervencion.espacioCerrado,
      contrasteYodado: intervencion.contrasteYodado,
    }),
    [cribado, medicacion, basicos, sexo, intervencion],
  );

  const plan = useMemo(
    () => construirPlanPaciente(medicacion, intervencion, clin, basicos.pesoKg, hoy),
    [medicacion, intervencion, clin, basicos.pesoKg, hoy],
  );

  // Puntos de validación clínica (§13 bis): si hay alguno activo, la hoja del paciente
  // muestra el aviso de que el anestesiólogo revisará su caso (revisionPendiente).
  const revisionPendiente = useMemo(() => {
    let stentReciente = false;
    if (clin.stent && clin.stent.mesesDesdeImplante !== null) {
      const refFecha = intervencion.fechaHora ?? new Date(hoy.getTime() + 90 * MS_DIA);
      const ctxStent = construirContexto({ ...intervencion, fechaHora: refFecha, fechaDesconocida: false }, basicos.pesoKg, clin.aclaramiento, undefined, hoy);
      stentReciente = evaluarStent({ mesesDesdeImplante: clin.stent.mesesDesdeImplante, traSca: clin.stent.traSca ?? true }, ctxStent).recienteRequiereConfirmacion;
    }
    const puntos = derivarPuntosValidacion({
      catalogo: VALIDACIONES, modulos: MODULOS, respuestas: cribado.respuestasModulos, activos: new Set(cribado.enfermedades),
      fechaIntervencion: intervencion.fechaHora ?? null, fechaReferencia: hoy,
      hechosEspeciales: { stentReciente },
    });
    return puntos.length > 0;
  }, [clin, cribado, intervencion, basicos.pesoKg, hoy]);

  // Ayuno (§8.14) y condicionales de la hoja (§10.2).
  const { ayunoQr, extras } = useMemo(() => {
    // AUDIT-C solo si las tres preguntas están contestadas (§6.9); si no, no hay anexo de alcohol.
    const auditPositivo = habitos && habitos.auditFrecuencia !== undefined && habitos.auditCantidad !== undefined && habitos.auditAtracon !== undefined
      ? calcularAuditC({ frecuenciaConsumo: habitos.auditFrecuencia, cantidadTipica: habitos.auditCantidad, frecuenciaAtracon: habitos.auditAtracon, sexo }).positivo
      : false;
    const cuatroAtPuntuacion = habitos?.cuatroAt ? calcular4AT(habitos.cuatroAt).puntuacion : undefined;
    const extrasIn = derivarHojaExtras({
      edadAnios: basicos.edadAnios,
      ...(basicos.semanasGestacion !== undefined ? { semanasGestacion: basicos.semanasGestacion } : {}),
      enfermedades: new Set(cribado.enfermedades),
      respuestas: cribado.respuestasModulos,
      tabacoActivo: habitos?.tabaco === 'activo',
      auditPositivo,
      ...(habitos?.cfs !== undefined ? { cfs: habitos.cfs } : {}),
      ...(cuatroAtPuntuacion !== undefined ? { cuatroAtPuntuacion } : {}),
      edadPediatricaMaxima: EDAD_PEDIATRICA_MAXIMA,
      glp1Semanal: medicacion.some((f) => f.idRegla === 'glp1_semanal'),
      diabetes: new Set(cribado.enfermedades).has('diabetes'),
      ...(revisionPendiente ? { revisionPendiente: true } : {}),
    });
    const refFecha = intervencion.fechaHora ?? new Date(hoy.getTime() + 90 * MS_DIA);
    const planAyuno = calcularAyuno({
      induccion: refFecha,
      pediatrico: extrasIn.pediatrico,
      ...(basicos.edadMeses !== undefined ? { edadMeses: basicos.edadMeses } : {}),
      situacion: extrasIn.situacion,
    });
    const extras = consentimiento ? { ...extrasIn.extras, cons: CONS_MAP[consentimiento.estado] } : extrasIn.extras;
    return { ayunoQr: ayunoQrDesde(planAyuno, extrasIn.pediatrico, extrasIn.situacion), extras };
  }, [basicos, cribado, habitos, sexo, intervencion.fechaHora, medicacion, consentimiento, hoy, revisionPendiente]);

  // §3 (2026-10-04): la hoja y el QR se generan SIEMPRE, sin bloqueo por fármacos
  // pendientes. Los pendientes aparecen en la hoja con la frase única de §12
  // («Sobre [fármaco], el anestesiólogo le llamará…») y siguen listados y
  // confirmables en el resumen del anestesiólogo (sección «Puntos pendientes»).
  if (!generar) {
    return (
      <button type="button" className="boton-primario" onClick={() => setGenerar(true)}>
        Generar hoja y QR del paciente
      </button>
    );
  }

  return <HojaPaciente plan={plan} intervencion={intervencion} ay={ayunoQr} ex={extras} />;
}
