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
import { calcularAyuno } from '../../dominio/ayuno/ayuno.ts';
import { ayunoQrDesde } from '../../dominio/salidas/qr/construirContenido.ts';
import { calcularAuditC } from '../../dominio/escalas/auditC.ts';
import { calcular4AT } from '../../dominio/escalas/cuatroAT.ts';
import type { CribadoUi, DatosBasicosUi, FarmacoTomadoUi, HabitosUi } from '../estadoEntrevista.ts';
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
  onActualizar: (indice: number, cambios: Partial<FarmacoTomadoUi>) => void;
}

export function BloqueHojaPaciente({ medicacion, intervencion, basicos, cribado, habitos, onActualizar }: Props) {
  const [nombres, setNombres] = useState<Record<number, string>>({});
  const [generar, setGenerar] = useState(false);

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
    () => construirPlanPaciente(medicacion, intervencion, clin, basicos.pesoKg),
    [medicacion, intervencion, clin, basicos.pesoKg],
  );

  // Ayuno (§8.14) y condicionales de la hoja (§10.2).
  const { ayunoQr, extras } = useMemo(() => {
    const auditPositivo = habitos
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
    });
    const refFecha = intervencion.fechaHora ?? new Date(Date.now() + 90 * MS_DIA);
    const planAyuno = calcularAyuno({
      induccion: refFecha,
      pediatrico: extrasIn.pediatrico,
      ...(basicos.edadMeses !== undefined ? { edadMeses: basicos.edadMeses } : {}),
      situacion: extrasIn.situacion,
    });
    return { ayunoQr: ayunoQrDesde(planAyuno, extrasIn.pediatrico, extrasIn.situacion), extras: extrasIn.extras };
  }, [basicos, cribado, habitos, sexo, intervencion.fechaHora]);

  const pendientes = medicacion
    .map((f, i) => ({ f, i, requiere: plan[i]?.resultado.requiereConfirmacion === true }))
    .filter(({ f, requiere }) => requiere && !f.confirmadoPor && !f.leLlamaremos);

  if (pendientes.length > 0) {
    return (
      <div className="pendientes-confirmacion">
        <p className="aviso aviso-atencion" role="alert">
          No se puede generar la hoja ni el QR mientras haya fármacos pendientes de confirmar
          por el anestesiólogo. Confirme cada uno con su nombre o márquelo como «le llamaremos».
        </p>
        <ul className="lista-pendientes">
          {pendientes.map(({ f, i }) => (
            <li key={`${f.idFarmaco}-${i}`} className="pendiente">
              <strong>{f.nombreComercial}</strong>
              <div className="pendiente-controles">
                <input
                  type="text"
                  placeholder="Nombre del anestesiólogo"
                  value={nombres[i] ?? ''}
                  onChange={(e) => setNombres((n) => ({ ...n, [i]: e.target.value }))}
                  aria-label={`Nombre del anestesiólogo para ${f.nombreComercial}`}
                />
                <button
                  type="button"
                  className="boton-secundario"
                  disabled={!(nombres[i] ?? '').trim()}
                  onClick={() => onActualizar(i, { confirmadoPor: (nombres[i] ?? '').trim(), leLlamaremos: false })}
                >
                  Confirmar
                </button>
                <button type="button" className="boton-secundario" onClick={() => onActualizar(i, { leLlamaremos: true })}>
                  Le llamaremos
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!generar) {
    return (
      <button type="button" className="boton-primario" onClick={() => setGenerar(true)}>
        Generar hoja y QR del paciente
      </button>
    );
  }

  return <HojaPaciente plan={plan} intervencion={intervencion} ay={ayunoQr} ex={extras} />;
}
