/**
 * Hoja del paciente con su QR (§10.2, §11.1). Se muestra desde el resumen (consulta
 * presencial). Construye el contenido estructurado, lo serializa en el enlace
 * (tras «#p=»), genera la imagen del QR y ofrece «Copiar enlace para el paciente».
 * Al escanear el QR se abre la vista interactiva (VistaPaciente).
 */
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import config from '../../../datos/config.json';
import type { DatosIntervencion } from '../../dominio/tipos.ts';
import {
  recalcularHoja,
  caducidadQrPaciente,
} from '../../dominio/salidas/qr/hojaPaciente.ts';
import {
  construirContenidoQrPaciente,
  payloadPaciente,
  type FarmacoPlan,
} from '../../dominio/salidas/qr/construirContenido.ts';
import { serializar, cabeEnQr } from '../../dominio/salidas/qr/serializar.ts';

interface Props {
  plan: FarmacoPlan[];
  intervencion: DatosIntervencion;
}

export function HojaPaciente({ plan, intervencion }: Props) {
  const [cadena, setCadena] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const contenido = useMemo(
    () => construirContenidoQrPaciente(plan, config.telefono_contacto, intervencion.fechaHora),
    [plan, intervencion.fechaHora],
  );

  const instrucciones = useMemo(
    () => recalcularHoja(contenido, intervencion.fechaHora),
    [contenido, intervencion.fechaHora],
  );

  useEffect(() => {
    let vivo = true;
    const creacion = new Date();
    const caducidad = caducidadQrPaciente(creacion, intervencion.fechaHora, config.dias_validez_qr_paciente, config.dias_validez_qr_paciente_sin_fecha);
    const payload = payloadPaciente(contenido, config.version_contenido, creacion, caducidad);
    void serializar(payload).then(async (c) => {
      if (!vivo) return;
      setCadena(c);
      const url = `${location.origin}${location.pathname}#p=${c}`;
      try {
        const data = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
        if (vivo) setQrDataUrl(data);
      } catch {
        if (vivo) setQrDataUrl(null);
      }
    });
    return () => {
      vivo = false;
    };
  }, [contenido, intervencion.fechaHora]);

  const enlace = cadena ? `${location.origin}${location.pathname}#p=${cadena}` : '';
  const cabe = cadena ? cabeEnQr(cadena) : true;

  async function copiar() {
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <section className="tarjeta hoja-paciente" aria-labelledby="hoja-tit">
      <h2 id="hoja-tit">Hoja del paciente</h2>

      <h3>Qué hacer con cada medicamento</h3>
      {instrucciones.length === 0 ? (
        <p>No se ha registrado medicación.</p>
      ) : (
        <table className="tabla-medicacion">
          <thead><tr><th>Medicamento</th><th>Qué hacer</th></tr></thead>
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

      <h3>Código QR para el paciente</h3>
      <p>El paciente puede escanear este código con el móvil para ver sus recomendaciones y, si le cambian la fecha, recalcularlas.</p>
      {qrDataUrl ? (
        <img className="qr-img" src={qrDataUrl} alt="Código QR de la hoja del paciente" width={240} height={240} />
      ) : (
        <p>Generando el código…</p>
      )}
      {!cabe && (
        <p className="aviso aviso-atencion">La información es demasiado extensa para el QR; use el enlace.</p>
      )}
      <div className="acciones">
        <button type="button" className="boton-secundario" onClick={copiar} disabled={!enlace}>
          {copiado ? 'Enlace copiado ✓' : 'Copiar enlace para el paciente'}
        </button>
      </div>

      <p className="aviso aviso-info">
        Si le cambian la fecha o la hora de la intervención, el paciente debe abrir de nuevo este código e introducir la nueva fecha.
      </p>
    </section>
  );
}
