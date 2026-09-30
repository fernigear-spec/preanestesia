/**
 * Guía imprimible en blanco (§14.4). Genera, a partir de los módulos de patología y
 * de las preguntas fijas, un guion por pasos con casillas para anotar a mano, por si
 * falla el equipo. Se imprime con «Guardar como PDF» (window.print).
 */
import { MODULOS } from '../../datos/modulosDatos.ts';
import { PREGUNTAS_HEMSTOP } from '../estadoEntrevista.ts';
import type { PreguntaModulo } from '../../datos/modulos.ts';

interface Props {
  onSalir: () => void;
}

/** Representación en blanco de una pregunta según su tipo. */
function CampoBlanco({ p }: { p: PreguntaModulo }) {
  const etiqueta = `${p.etiqueta}${p.unidad ? ` (${p.unidad})` : ''}`;
  if (p.tipo === 'boolean') {
    return <li>{etiqueta} &nbsp; ☐ Sí &nbsp; ☐ No</li>;
  }
  if (p.tipo === 'opcion' || p.tipo === 'opcion_multiple') {
    return (
      <li>
        {etiqueta}
        <span className="guia-opciones">{(p.opciones ?? []).map((o) => `☐ ${o.etiqueta}`).join('   ')}</span>
      </li>
    );
  }
  return <li>{etiqueta}: <span className="guia-linea" /></li>;
}

export function GuiaImprimible({ onSalir }: Props) {
  return (
    <div className="app guia">
      <header className="cabecera no-print">
        <h1>Guía imprimible en blanco</h1>
        <p className="subtitulo">Guion de preguntas por pasos y por patología, con casillas para anotar a mano.</p>
        <div className="acciones">
          <button type="button" className="boton-primario" onClick={() => window.print()}>Guardar como PDF / Imprimir</button>
          <button type="button" className="boton-secundario" onClick={onSalir}>← Volver</button>
        </div>
      </header>

      <main className="contenido guia-contenido">
        <h2>Datos de la entrevista</h2>
        <ul className="guia-lista">
          <li>Modalidad: ☐ Presencial &nbsp; ☐ Telefónica</li>
          <li>Fecha de la intervención: <span className="guia-linea" /> Procedimiento: <span className="guia-linea" /></li>
          <li>Edad: <span className="guia-linea" /> Sexo: ☐ Hombre ☐ Mujer &nbsp; Peso (kg): <span className="guia-linea" /> Talla (cm): <span className="guia-linea" /></li>
          <li>Posibilidad de embarazo (mujeres 12-55): ☐ Sí ☐ No</li>
        </ul>

        <h2>Antecedentes y hábitos</h2>
        <ul className="guia-lista">
          <li>Intervenciones y anestesias previas, incidencias: <span className="guia-linea" /></li>
          <li>Alergias: ☐ No conocidas &nbsp; Detalle: <span className="guia-linea" /></li>
          <li>Tabaco: ☐ Nunca ☐ Activo ☐ Exfumador &nbsp; AUDIT-C (0-4 cada una): <span className="guia-linea" /></li>
          <li>Capacidad funcional: ☐ Sube 2 pisos sin parar &nbsp; DASI: <span className="guia-linea" /></li>
          <li>Origen materno (mtND4): <span className="guia-linea" /></li>
        </ul>

        <h2>Cuestionario de sangrado (HEMSTOP)</h2>
        <ul className="guia-lista">
          {PREGUNTAS_HEMSTOP.map((p) => <li key={p.id}>{p.etiqueta} &nbsp; ☐ Sí &nbsp; ☐ No</li>)}
        </ul>

        <h2>Módulos por patología</h2>
        <p className="guia-nota no-print">Se listan todas las preguntas de todos los módulos; en la entrevista real solo aparecen los de las enfermedades marcadas.</p>
        {MODULOS.map((m) => (
          <section key={m.id} className="guia-modulo">
            <h3>{m.titulo}</h3>
            <ul className="guia-lista">
              {m.preguntas.map((p) => <CampoBlanco key={p.id} p={p} />)}
            </ul>
          </section>
        ))}

        <h2>Vía aérea, consentimiento y notas</h2>
        <ul className="guia-lista">
          <li>Mallampati: ☐ I ☐ II ☐ III ☐ IV &nbsp; Apertura bucal: ☐ ≥4 cm ☐ &lt;4 cm</li>
          <li>Distancia tiromentoniana: ☐ &gt;6,5 ☐ 6-6,5 ☐ &lt;6 &nbsp; Movilidad cervical: ☐ &gt;90° ☐ 80-90° ☐ &lt;80°</li>
          <li>Perímetro del cuello (cm): <span className="guia-linea" /> &nbsp; Barba: ☐ Sí ☐ No &nbsp; Ronquido: ☐ Sí ☐ No</li>
          <li>Consentimiento: ☐ Entregado ☐ Pendiente ☐ No procede</li>
          <li>Notas: <span className="guia-linea" /></li>
        </ul>
      </main>
    </div>
  );
}
