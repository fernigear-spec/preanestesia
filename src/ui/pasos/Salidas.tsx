/**
 * Salidas del paso 11 (§10.1 y §10.3): texto para SAP y resumen del anestesiólogo.
 * Reúne alertas por gravedad, ASA sugerido (modificable), escalas con sus
 * componentes, plan de medicación con regla y fuente, pruebas con su motivo, ayuno
 * y las notas técnicas plegables.
 */
import { useMemo, useState } from 'react';
import config from '../../../datos/config.json';
import plantillasSap from '../../../datos/plantillas_sap.json';
import type { GravedadAlerta } from '../../dominio/tipos.ts';
import { calcularImc, type EstadoEntrevista } from '../estadoEntrevista.ts';
import { MODULO_POR_ID } from '../../datos/modulosDatos.ts';
import { derivarHechosClinicos } from '../../dominio/entrevista/hechosClinicos.ts';
import { derivarHojaExtras } from '../../dominio/entrevista/hojaExtras.ts';
import { derivarRiesgoYPruebas } from '../../dominio/entrevista/riesgoYPruebas.ts';
import { construirPlanPaciente } from '../paciente/construirPlanUi.ts';
import { calcularAyuno } from '../../dominio/ayuno/ayuno.ts';
import { calcularEgri, EGRI_UMBRAL_RIESGO } from '../../dominio/escalas/egri.ts';
import { calcularLangeron } from '../../dominio/escalas/langeron.ts';
import { calcularCha2ds2va } from '../../dominio/escalas/cha2ds2va.ts';
import { calcularApfel } from '../../dominio/escalas/apfel.ts';
import { calcularDasi } from '../../dominio/escalas/dasi.ts';
import { calcularAuditC } from '../../dominio/escalas/auditC.ts';
import { calcular4AT } from '../../dominio/escalas/cuatroAT.ts';
import { calcularHemstop } from '../../dominio/escalas/hemstop.ts';
import { evaluarMtnd4 } from '../../dominio/mtnd4/mtnd4.ts';
import { derivarAsa } from '../../dominio/salidas/asaSugerido.ts';
import { construirSap, type EntradaSap } from '../../dominio/salidas/construirSap.ts';
import type { ClaseAsa } from '../../dominio/escalas/asa.ts';
import type { PruebaSolicitada } from '../../dominio/pruebas/tablaPruebas.ts';

interface Props {
  entrevista: EstadoEntrevista;
  modalidad: string;
}

interface AlertaVista { gravedad: GravedadAlerta; mensaje: string; }
interface EscalaVista { nombre: string; valor: string; componentes: string[]; }

const ORDEN_GRAVEDAD: Record<GravedadAlerta, number> = { roja: 0, amarilla: 1, informativa: 2 };
function fechaCorta(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function Salidas({ entrevista, modalidad }: Props) {
  const { intervencion, basicos, antecedentes, mtnd4, alergias, habitos, cribado, medicacion, viaAerea, consentimiento } = entrevista;
  const [soloAscii, setSoloAscii] = useState(false);
  const [asaManual, setAsaManual] = useState<ClaseAsa | ''>('');
  const [notasAbiertas, setNotasAbiertas] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const salida = useMemo(() => {
    if (!intervencion || !basicos || !cribado) return null;
    const enfermedades = new Set(cribado.enfermedades);
    const respuestas = cribado.respuestasModulos;
    const imc = calcularImc(basicos.pesoKg, basicos.tallaCm);

    const clin = derivarHechosClinicos({
      respuestas, enfermedades,
      medicacion: (medicacion ?? []).map((f) => ({ principiosActivos: f.principiosActivos, idRegla: f.idRegla })),
      edadAnios: basicos.edadAnios, pesoKg: basicos.pesoKg, sexo: basicos.sexo,
      fechaIntervencion: intervencion.fechaHora, espacioCerrado: intervencion.espacioCerrado, contrasteYodado: intervencion.contrasteYodado,
    });
    const plan = construirPlanPaciente(medicacion ?? [], intervencion, clin, basicos.pesoKg);

    const audit = habitos ? calcularAuditC({ frecuenciaConsumo: habitos.auditFrecuencia, cantidadTipica: habitos.auditCantidad, frecuenciaAtracon: habitos.auditAtracon, sexo: basicos.sexo }) : null;
    const cuatroAt = habitos?.cuatroAt ? calcular4AT(habitos.cuatroAt) : null;
    const hemstop = calcularHemstop(cribado.hemstop);

    const rp = derivarRiesgoYPruebas({
      respuestas, enfermedades, edadAnios: basicos.edadAnios, imc,
      hemstopPositivo: hemstop.positivo,
      medicacionGrupos: new Set((medicacion ?? []).map((f) => grupoAntitrombotico(f.idRegla)).filter((g): g is string => g !== null)),
      riesgoCardiovascular: intervencion.riesgoCardiovascular, riesgoHemorragico: intervencion.riesgoHemorragico,
      neuroaxialProbable: intervencion.neuroaxialProbable, tecnica: intervencion.tecnica,
    });

    const extras = derivarHojaExtras({
      edadAnios: basicos.edadAnios, ...(basicos.semanasGestacion !== undefined ? { semanasGestacion: basicos.semanasGestacion } : {}),
      enfermedades, respuestas, tabacoActivo: habitos?.tabaco === 'activo', auditPositivo: audit?.positivo ?? false,
      ...(habitos?.cfs !== undefined ? { cfs: habitos.cfs } : {}), ...(cuatroAt ? { cuatroAtPuntuacion: cuatroAt.puntuacion } : {}),
      edadPediatricaMaxima: config.edad_pediatrica_maxima, glp1Semanal: (medicacion ?? []).some((f) => f.idRegla === 'glp1_semanal'), diabetes: enfermedades.has('diabetes'),
    });
    const refFecha = intervencion.fechaHora ?? new Date(Date.now() + 90 * 86_400_000);
    const ayuno = calcularAyuno({ induccion: refFecha, pediatrico: extras.pediatrico, ...(basicos.edadMeses !== undefined ? { edadMeses: basicos.edadMeses } : {}), situacion: extras.situacion });

    // ASA.
    const asa = derivarAsa({
      edadAnios: basicos.edadAnios, imc, embarazada: basicos.moduloObstetrico === true || basicos.embarazada === true,
      tabacoActivo: habitos?.tabaco === 'activo', abusoAlcohol: audit?.riesgoAbstinencia ?? false,
      enfermedades, respuestas, urgencia: intervencion.caracter === 'urgencia_diferida', ...(asaManual !== '' ? { claseManual: asaManual } : {}),
    });

    // Escalas.
    const escalas: EscalaVista[] = [];
    if (viaAerea) {
      const egri = calcularEgri({ pesoKg: basicos.pesoKg, ...(viaAerea.aperturaBucal ? { aperturaBucal: viaAerea.aperturaBucal } : {}), ...(viaAerea.distanciaTiromentoniana ? { distanciaTiromentoniana: viaAerea.distanciaTiromentoniana } : {}), ...(viaAerea.mallampati ? { mallampati: viaAerea.mallampati } : {}), ...(viaAerea.movilidadCervical ? { movilidadCervical: viaAerea.movilidadCervical } : {}), ...(viaAerea.puedeProtruir !== undefined ? { puedeProtruir: viaAerea.puedeProtruir } : {}), ...(viaAerea.intubacionDificilPrevia ? { intubacionDificilPrevia: viaAerea.intubacionDificilPrevia } : {}) });
      escalas.push({ nombre: `EGRI${modalidad === 'telefonica' ? ' (parcial)' : ''}`, valor: `${egri.puntuacion} · ${egri.puntuacion >= EGRI_UMBRAL_RIESGO ? 'riesgo elevado' : 'sin riesgo elevado'}`, componentes: egri.componentes });
      const lang = calcularLangeron({ barba: viaAerea.barba === true, imc: imc ?? 0, edentulo: viaAerea.denticion === 'edentulo', edadAnios: basicos.edadAnios, ronquido: viaAerea.ronquido === true });
      escalas.push({ nombre: 'Langeron', valor: `${lang.puntuacion} · ${lang.categoria}`, componentes: lang.componentes });
    }
    if (enfermedades.has('fibrilacion_auricular')) {
      const fa = respuestas['fibrilacion_auricular'] ?? {};
      const cha = calcularCha2ds2va({ insuficienciaCardiaca: enfermedades.has('insuficiencia_cardiaca'), hta: enfermedades.has('hta'), edadAnios: basicos.edadAnios, diabetes: enfermedades.has('diabetes'), ictusAitTromboembolismo: fa.ictus_ait_previo === true, enfermedadVascular: enfermedades.has('cardiopatia_isquemica') || enfermedades.has('stent_o_infarto') });
      escalas.push({ nombre: 'CHA2DS2-VA', valor: String(cha.puntuacion), componentes: cha.componentes });
    }
    if (!extras.pediatrico) {
      const nvpo = (antecedentes?.intervencionesPrevias ?? []).some((iq) => iq.incidencias.includes('nvpo'));
      const apfel = calcularApfel({ mujer: basicos.sexo === 'mujer', noFumador: habitos?.tabaco === 'nunca', nvpoOCinetosisPrevias: nvpo, riesgoQuirurgico: intervencion.riesgoCardiovascular });
      escalas.push({ nombre: 'Apfel', valor: `${apfel.puntuacion} (${apfel.categoria})`, componentes: apfel.componentes });
    }
    if (habitos && habitos.subeDosPisos !== 'si' && habitos.itemsDasi.length > 0) {
      const dasi = calcularDasi(habitos.itemsDasi as never[]);
      escalas.push({ nombre: 'DASI', valor: `${dasi.dasi} · ${dasi.categoria}`, componentes: [] });
    }
    if (habitos?.cfs !== undefined) escalas.push({ nombre: 'CFS', valor: String(habitos.cfs), componentes: [] });
    if (cuatroAt) escalas.push({ nombre: '4AT', valor: `${cuatroAt.puntuacion} · ${cuatroAt.categoria}`, componentes: cuatroAt.componentes });
    if (audit) escalas.push({ nombre: 'AUDIT-C', valor: `${audit.puntuacion} · ${audit.categoria}`, componentes: [] });
    escalas.push({ nombre: 'HEMSTOP', valor: `${hemstop.puntuacion} · ${hemstop.positivo ? 'positivo' : 'negativo'}`, componentes: [] });
    if (clin.aclaramiento !== null) escalas.push({ nombre: 'Aclaramiento (Cockcroft-Gault)', valor: `${clin.aclaramiento} mL/min`, componentes: [] });

    // Alertas.
    const alertas: AlertaVista[] = [];
    const mt = mtnd4 ? evaluarMtnd4(mtnd4) : null;
    if (mt?.alerta) alertas.push({ gravedad: mt.alerta.gravedad, mensaje: mt.alerta.mensaje });
    if (hemstop.positivo) alertas.push({ gravedad: 'amarilla', mensaje: 'HEMSTOP positivo: se solicita estudio de coagulación.' });
    if (viaAerea?.radioterapiaCervical) alertas.push({ gravedad: 'amarilla', mensaje: 'Radioterapia cervical: vía aérea difícil.' });
    if (viaAerea?.tumorCabezaCuello) alertas.push({ gravedad: 'amarilla', mensaje: 'Tumor de cabeza y cuello: vía aérea difícil.' });
    if (viaAerea?.intubacionDificilPrevia === 'confirmado') alertas.push({ gravedad: 'amarilla', mensaje: 'Intubación difícil previa confirmada.' });
    if (cuatroAt && cuatroAt.puntuacion >= 4) alertas.push({ gravedad: 'roja', mensaje: '4AT ≥ 4: posible delirium actual.' });
    else if (cuatroAt && cuatroAt.puntuacion >= 1) alertas.push({ gravedad: 'amarilla', mensaje: '4AT 1-3: riesgo de delirium.' });
    if (habitos?.cfs !== undefined && habitos.cfs >= 5) alertas.push({ gravedad: 'amarilla', mensaje: 'Fragilidad (CFS ≥ 5).' });
    if (audit?.riesgoAbstinencia) alertas.push({ gravedad: 'amarilla', mensaje: 'AUDIT-C ≥ 8: riesgo de síndrome de abstinencia.' });
    if (enfermedades.has('marcapasos')) alertas.push({ gravedad: 'amarilla', mensaje: 'Marcapasos/DAI: revisar dispositivo.' });
    alertas.sort((a, b) => ORDEN_GRAVEDAD[a.gravedad] - ORDEN_GRAVEDAD[b.gravedad]);

    // Notas técnicas.
    const notas: string[] = [...ayuno.notasAnestesiologo];
    for (const f of plan) if (f.resultado.textoAnestesiologo) notas.push(`${f.resultado.nombreComercial}: ${f.resultado.textoAnestesiologo}`);
    if (mt?.alerta?.gravedad === 'roja') notas.push('mtND4: seguir las medidas del consenso SEDAR (evitar halogenados/TIVA, regional preferente, monitorización de profundidad, etc.).');

    // Confirmaciones (§12).
    const confirmadoPor = [...new Set((medicacion ?? []).filter((f) => f.confirmadoPor).map((f) => f.confirmadoPor as string))];

    // Resumen de módulos (§5.16) para el SAP.
    const resumenModulos = [...enfermedades].map((id) => resumenModulo(id, respuestas)).filter((s): s is string => s !== null);

    // SAP.
    const fechaTxt = intervencion.fechaHora ? fechaCorta(intervencion.fechaHora) : 'sin fecha';
    const entradaSap: EntradaSap = {
      cabecera: `VALORACION PREANESTESICA ENFERMERIA ${fechaTxt} (${modalidad})`,
      datos: `Edad ${basicos.edadAnios} a. Peso ${basicos.pesoKg} kg. Talla ${basicos.tallaCm} cm.${imc !== null ? ` IMC ${imc}.` : ''}`,
      alergias: alergias ? (alergias.ningunaConocida ? 'Alergias: NAMC.' : `Alergias: ${alergias.medicamentos.map((m) => m.reaccion ? `${m.farmaco} (${m.reaccion})` : m.farmaco).join(', ') || 'ver detalle'}.`) : '',
      habitos: habitos ? `Habitos: ${habitos.tabaco === 'nunca' ? 'no fumador' : habitos.tabaco === 'activo' ? 'fumador activo' : 'exfumador'}. AUDIT-C ${audit?.puntuacion ?? 0}.` : '',
      antecedentesPatologicos: resumenModulos,
      iqPrevias: (antecedentes?.intervencionesPrevias ?? []).map((iq) => `${iq.procedimiento}${iq.anio ? ` ${iq.anio}` : ''}`),
      antecedentesAnestesicos: (antecedentes?.intervencionesPrevias ?? []).some((iq) => iq.incidencias.length > 0) ? 'incidencias previas (ver detalle)' : 'sin incidencias',
      negativos: { alergiasConocidas: !!alergias && !alergias.ningunaConocida, hipertermiaMalignaFamiliar: antecedentes?.familiaresHipertermiaMaligna ?? false, antecedentesFamiliaresAnestesicos: (antecedentes?.familiaresHipertermiaMaligna || antecedentes?.familiaresDeficitPseudocolinesterasa || antecedentes?.familiaresComplicacionesGraves) ?? false, mtnd4Positivo: mt?.alerta?.gravedad === 'roja', hemstopPositivo: hemstop.positivo },
      capacidadFuncional: habitos ? `Capacidad funcional: ${habitos.subeDosPisos === 'si' ? '>4 METs' : 'DASI evaluado'}.` : '',
      viaAerea: viaAerea ? `Via aerea: ${escalas.filter((s) => s.nombre.startsWith('EGRI') || s.nombre === 'Langeron').map((s) => `${s.nombre} ${s.valor}`).join('; ')}.` : '',
      escalas: `Escalas: ${escalas.map((s) => `${s.nombre} ${s.valor}`).join('; ')}.`,
      asa: `ASA sugerido ${'I'.repeat(asa.clase)}${asa.sufijoE ? 'E' : ''}${asa.modificadoManualmente ? ' (modificado)' : ''}.`,
      tratamientoHabitual: (medicacion ?? []).length > 0 ? `Tto habitual: ${(medicacion ?? []).map((f) => f.nombreComercial).join(', ')}.` : '',
      plan: plan.map((f) => `${f.resultado.nombreComercial}: ${f.resultado.accion}${f.resultado.fechaHoraUltimaToma ? ` (última ${fechaCorta(f.resultado.fechaHoraUltimaToma)})` : ''}`),
      pruebas: `Pruebas: ${rp.pruebas.map((p) => p.prueba).join(', ') || 'ninguna'}.`,
      consentimiento: consentimiento ? `Consentimiento: ${consentimiento.estado === 'entregado' ? `entregado${consentimiento.fecha ? ` ${consentimiento.fecha}` : ''}` : consentimiento.estado === 'pendiente_entregar' ? 'se entregará el día de la intervención' : 'no procede'}.` : '',
      confirmadoPor,
    };
    const sap = construirSap(entradaSap, { soloAscii, usarAbreviaturas: true, abreviaturas: plantillasSap.abreviaturas, limiteCaracteres: config.limite_caracteres_sap });

    return { asa, escalas, alertas, notas, plan, pruebas: rp.pruebas, claseRiesgo: rp.clase, ayuno, sap };
  }, [intervencion, basicos, cribado, medicacion, habitos, viaAerea, consentimiento, antecedentes, mtnd4, alergias, modalidad, soloAscii, asaManual]);

  if (!salida) return null;

  async function copiarSap() {
    try { await navigator.clipboard.writeText(salida!.sap.texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { setCopiado(false); }
  }

  return (
    <>
      <h3>Resumen del anestesiólogo</h3>

      {salida.alertas.length > 0 && (
        <div className="resumen-alertas">
          {salida.alertas.map((a, i) => (
            <p key={i} className={`aviso ${a.gravedad === 'roja' ? 'aviso-atencion' : a.gravedad === 'amarilla' ? 'aviso-atencion' : 'aviso-info'}`}>
              <strong>{a.gravedad === 'roja' ? '🔴' : a.gravedad === 'amarilla' ? '🟡' : 'ℹ️'}</strong> {a.mensaje}
            </p>
          ))}
        </div>
      )}

      <div className="campo">
        <label htmlFor="asa-manual"><strong>ASA sugerido: {'I'.repeat(salida.asa.clase)}{salida.asa.sufijoE ? 'E' : ''}</strong> (puede modificarlo)</label>
        <select id="asa-manual" value={asaManual} onChange={(e) => setAsaManual(e.target.value === '' ? '' : Number(e.target.value) as ClaseAsa)}>
          <option value="">Sugerido ({salida.asa.determinantes.join(', ') || 'sano'})</option>
          {[1, 2, 3, 4, 5].map((c) => <option key={c} value={c}>ASA {'I'.repeat(c)}</option>)}
        </select>
      </div>

      <h4>Escalas</h4>
      <ul className="resumen-lista">
        {salida.escalas.map((s, i) => (
          <li key={i}><strong>{s.nombre}:</strong> {s.valor}{s.componentes.length > 0 ? ` — ${s.componentes.join(', ')}` : ''}</li>
        ))}
      </ul>

      <h4>Plan de medicación</h4>
      {salida.plan.length === 0 ? <p>Sin medicación.</p> : (
        <ul className="resumen-lista">
          {salida.plan.map((f, i) => (
            <li key={i}><strong>{f.resultado.nombreComercial}:</strong> {f.resultado.accion} · {f.resultado.reglaAplicada} <em>({f.resultado.fuente})</em></li>
          ))}
        </ul>
      )}

      <h4>Pruebas complementarias</h4>
      <ul className="resumen-lista">
        {salida.pruebas.length === 0 ? <li>Ninguna.</li> : salida.pruebas.map((p: PruebaSolicitada, i: number) => (
          <li key={i}><strong>{p.prueba}:</strong> {p.motivo}</li>
        ))}
      </ul>

      <h4>Ayuno</h4>
      <ul className="resumen-lista">
        {salida.ayuno.lineas.map((l, i) => <li key={i}>{l.concepto}: {l.hora}</li>)}
      </ul>

      <button type="button" className="boton-enlace" onClick={() => setNotasAbiertas((v) => !v)} aria-expanded={notasAbiertas}>
        {notasAbiertas ? '▼' : '▶'} Notas técnicas ({salida.notas.length})
      </button>
      {notasAbiertas && (
        <ul className="resumen-lista">
          {salida.notas.length === 0 ? <li>Sin notas.</li> : salida.notas.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}

      <h3>Texto para SAP</h3>
      <div className="campo">
        <label className="radio-tarjeta">
          <input type="checkbox" checked={soloAscii} onChange={() => setSoloAscii((v) => !v)} /> Solo ASCII (si SAP da problemas con tildes)
        </label>
      </div>
      <textarea className="sap-texto" readOnly rows={16} value={salida.sap.texto} aria-label="Texto para SAP" />
      <p className={salida.sap.excedeLimite ? 'aviso aviso-atencion' : ''}>
        {salida.sap.caracteres} caracteres{salida.sap.excedeLimite ? ` · supera el límite de ${config.limite_caracteres_sap}` : ''}.
      </p>
      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={copiarSap}>{copiado ? 'Copiado ✓' : 'Copiar'}</button>
      </div>
    </>
  );
}

/** Grupo antitrombótico de un id_regla (para los factores de pruebas). */
function grupoAntitrombotico(idRegla: string): string | null {
  if (/^(acod_|avk_)/.test(idRegla) || idRegla === 'hbpm' || idRegla === 'fondaparinux' || idRegla === 'heparina_sodica') return 'anticoagulante';
  if (/^p2y12_/.test(idRegla) || ['aas', 'triflusal', 'dipiridamol', 'cilostazol', 'gp_iibiiia', 'sulodexida'].includes(idRegla)) return 'antiagregante';
  return null;
}

/** Resumen legible de un módulo (§5.16) a partir de sus respuestas contestadas. */
function resumenModulo(id: string, respuestas: Record<string, Record<string, unknown>>): string | null {
  const moduloId = id === 'stent_o_infarto' ? 'cardiopatia_isquemica' : id === 'protesis_mecanica' ? 'valvulopatia' : id;
  const modulo = MODULO_POR_ID[moduloId];
  const resp = respuestas[moduloId] ?? {};
  if (!modulo) return null;
  const partes: string[] = [];
  for (const p of modulo.preguntas) {
    const v = resp[p.id];
    if (v === undefined || v === null || v === false || v === '') continue;
    if (v === true) partes.push(p.etiqueta);
    else if (Array.isArray(v)) { if (v.length > 0) partes.push(`${p.etiqueta}: ${v.join(', ')}`); }
    else partes.push(`${p.etiqueta}: ${String(v)}`);
  }
  return partes.length > 0 ? `${modulo.titulo} (${partes.slice(0, 4).join('; ')})` : modulo.titulo;
}
