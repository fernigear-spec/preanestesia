/**
 * Vista interactiva del paciente (§8.16 a/d/e/g, tarea 12.10). Se abre al escanear
 * el QR (la app detecta el fragmento «#p=…» en la URL). Es de solo lectura y:
 *  - muestra las instrucciones ya calculadas (recalcularHoja),
 *  - permite cambiar el idioma (castellano/catalán),
 *  - incluye el botón «Me han dado la fecha o me la han cambiado»: al introducir la
 *    fecha (y hora) recalcula todas las instrucciones y la caducidad,
 *  - avisa de que, si cambian la fecha, vuelva a abrir el código.
 */
import { useEffect, useMemo, useState } from 'react';
import config from '../../../datos/config.json';
import { deserializar } from '../../dominio/salidas/qr/serializar.ts';
import {
  recalcularHoja,
  caducidadQrPaciente,
  type ContenidoQrPaciente,
} from '../../dominio/salidas/qr/hojaPaciente.ts';
import { textosPaciente, type Idioma } from './textosPaciente.ts';

interface Props {
  /** Cadena serializada (lo que va tras «#p=»). */
  cadena: string;
}

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'invalido' }
  | { tipo: 'caducado' }
  | { tipo: 'ok'; contenido: ContenidoQrPaciente };

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function fechaLegible(d: Date): string {
  return `${DIAS[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} a las ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function VistaPaciente({ cadena }: Props) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [idioma, setIdioma] = useState<Idioma>('es');
  const [mostrarCambioFecha, setMostrarCambioFecha] = useState(false);
  const [fechaNueva, setFechaNueva] = useState('');
  const [horaNueva, setHoraNueva] = useState('');
  /** Fecha introducida por el paciente (sobrescribe la del QR). */
  const [fechaOverride, setFechaOverride] = useState<Date | null>(null);

  useEffect(() => {
    let vivo = true;
    void deserializar(cadena, new Date(), config.version_contenido).then((r) => {
      if (!vivo) return;
      if (r.estado === 'caducado') setEstado({ tipo: 'caducado' });
      else if (r.estado === 'invalido' || r.payload.t !== 'paciente') setEstado({ tipo: 'invalido' });
      else setEstado({ tipo: 'ok', contenido: r.payload.d as ContenidoQrPaciente });
    });
    return () => {
      vivo = false;
    };
  }, [cadena]);

  const t = textosPaciente(idioma);

  const fechaEfectiva = useMemo(() => {
    if (fechaOverride) return fechaOverride;
    if (estado.tipo === 'ok' && estado.contenido.fi !== null) return new Date(estado.contenido.fi);
    return null;
  }, [fechaOverride, estado]);

  const instrucciones = useMemo(() => {
    if (estado.tipo !== 'ok') return [];
    return recalcularHoja(estado.contenido, fechaEfectiva);
  }, [estado, fechaEfectiva]);

  function recalcular() {
    if (fechaNueva === '') return;
    setFechaOverride(new Date(`${fechaNueva}T${horaNueva === '' ? '08:00' : horaNueva}`));
    setMostrarCambioFecha(false);
  }

  if (estado.tipo === 'cargando') return <main className="contenido"><p>Cargando…</p></main>;
  if (estado.tipo === 'caducado') {
    return <main className="contenido"><section className="tarjeta"><p>Este enlace ha caducado. Llame al {config.telefono_contacto}.</p></section></main>;
  }
  if (estado.tipo === 'invalido') {
    return <main className="contenido"><section className="tarjeta"><p>Este enlace no es válido.</p></section></main>;
  }

  const caducidad = new Date(caducidadQrPaciente(new Date(estado.contenido.fi ?? Date.now()), fechaEfectiva, config.dias_validez_qr_paciente, config.dias_validez_qr_paciente_sin_fecha));

  return (
    <main className="contenido vista-paciente">
      <section className="tarjeta">
        <div className="idioma-selector">
          <button type="button" className={`chip-hora ${idioma === 'es' ? 'seleccionado' : ''}`} onClick={() => setIdioma('es')}>{t.idioma_es}</button>
          <button type="button" className={`chip-hora ${idioma === 'ca' ? 'seleccionado' : ''}`} onClick={() => setIdioma('ca')}>{t.idioma_ca}</button>
        </div>

        <h1>{t.titulo}</h1>

        <h2>{t.intervencion_titulo}</h2>
        {fechaEfectiva ? (
          <p><strong>{fechaLegible(fechaEfectiva)}</strong></p>
        ) : (
          <p className="aviso aviso-info">{t.sin_fecha_aviso}</p>
        )}

        <h2>{t.medicamentos_titulo}</h2>
        {idioma === 'ca' && t.medicacion_pendiente_traduccion && (
          <p className="aviso aviso-info">{t.medicacion_pendiente_traduccion}</p>
        )}
        {instrucciones.length === 0 ? (
          <p>{t.sin_medicamentos}</p>
        ) : (
          <table className="tabla-medicacion">
            <thead><tr><th>{t.col_medicamento}</th><th>{t.col_que_hacer}</th></tr></thead>
            <tbody>
              {instrucciones.map((i, k) => (
                <tr key={k} className={i.plazoNoCumplible ? 'fila-alerta' : ''}>
                  <td>{i.nombre}</td>
                  <td>{i.texto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2>{t.que_traer_titulo}</h2>
        <ul>{t.que_traer_items.map((it, k) => <li key={k}>{it}</li>)}</ul>

        <h2>{t.cuando_llamar_titulo}</h2>
        <ul>{t.cuando_llamar_items.map((it, k) => <li key={k}>{it}</li>)}</ul>

        <h2>{t.telefono_titulo}</h2>
        <p><strong>{config.telefono_contacto}</strong></p>

        <p className="aviso aviso-info">{t.aviso_cambio_fecha}</p>

        {!mostrarCambioFecha ? (
          <button type="button" className="boton-primario" onClick={() => setMostrarCambioFecha(true)}>{t.boton_cambiar_fecha}</button>
        ) : (
          <div className="cambio-fecha">
            <div className="campo">
              <label htmlFor="vp-fecha">{t.nueva_fecha_label}</label>
              <input id="vp-fecha" type="date" value={fechaNueva} onChange={(e) => setFechaNueva(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="vp-hora">{t.nueva_hora_label}</label>
              <input id="vp-hora" type="time" value={horaNueva} onChange={(e) => setHoraNueva(e.target.value)} />
            </div>
            <button type="button" className="boton-primario" onClick={recalcular}>{t.recalcular}</button>
          </div>
        )}

        <footer className="pie">
          <p>{t.pie}</p>
          <p>{config.nombre_centro} · v{config.version_contenido} ({config.fecha_revision_clinica})</p>
          <p>Válido hasta {caducidad.toLocaleDateString('es-ES')}.</p>
        </footer>
      </section>
    </main>
  );
}
