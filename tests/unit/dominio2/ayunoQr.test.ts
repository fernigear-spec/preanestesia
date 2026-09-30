/**
 * Ayuno en el QR del paciente (§8.14, comprobación B): el ayuno viaja estructurado
 * (horas antes por tipo de ingesta) y se recalculan las horas de reloj con la fecha;
 * sin fecha se muestra como «h antes de la intervención».
 */
import { describe, it, expect } from '../../_harness.ts';
import { calcularAyuno } from '../../../src/dominio/ayuno/ayuno.ts';
import { ayunoQrDesde, construirContenidoQrPaciente } from '../../../src/dominio/salidas/qr/construirContenido.ts';
import { serializar, deserializar, type Payload } from '../../../src/dominio/salidas/qr/serializar.ts';
import type { ContenidoQrPaciente } from '../../../src/dominio/salidas/qr/hojaPaciente.ts';
import { renderAyuno } from '../../../src/ui/paciente/render.ts';
import type { TextosPaciente } from '../../../src/ui/paciente/textosPaciente.ts';

const IV = new Date(2026, 9, 15, 8, 0);

// Textos mínimos para renderAyuno (evita importar el JSON en node).
const T = {
  dias_semana: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  meses: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  ayuno: {
    hasta: 'hasta las {hora}',
    rango: 'entre las {a} y las {b}',
    antes: 'hasta {n} h antes de la intervención',
    rango_antes: 'entre {a} y {b} h antes de la intervención',
    sin_hora: 'según indicación',
    labels: { comida_copiosa: 'Comida copiosa', bebida_carbohidratos: 'Bebida de carbohidratos' },
  },
} as unknown as TextosPaciente;

describe('§8.14 · ayuno en el QR', () => {
  it('el ayuno viaja estructurado y sobrevive al round-trip del QR', async () => {
    const ay = ayunoQrDesde(calcularAyuno({ induccion: IV, pediatrico: false, situacion: 'ninguna' }), false, 'ninguna');
    expect(ay.ln.length).toBeGreaterThan(3);
    const contenido = construirContenidoQrPaciente([], '900', IV, ay);
    const payload: Payload = { t: 'paciente', e: 1, v: '0.1.0', c: Date.now(), x: IV.getTime(), d: contenido };
    const cadena = await serializar(payload);
    const r = await deserializar(cadena, new Date(2026, 9, 2), '0.1.0');
    expect(r.estado).toBe('ok');
    const dec = r.estado === 'ok' ? (r.payload.d as ContenidoQrPaciente) : null;
    expect(dec?.ay?.ln.length).toBe(ay.ln.length);
  });

  it('con fecha, la comida copiosa (8 h antes de las 08:00) es a las 00:00', () => {
    const ay = ayunoQrDesde(calcularAyuno({ induccion: IV, pediatrico: false, situacion: 'ninguna' }), false, 'ninguna');
    const lineas = renderAyuno(ay, IV.getTime(), T);
    const copiosa = lineas.find((l) => l.etiqueta === 'Comida copiosa');
    expect(copiosa?.cuando).toContain('00:00');
    const carbs = lineas.find((l) => l.etiqueta === 'Bebida de carbohidratos');
    expect(carbs?.cuando).toContain('05:00');
  });

  it('sin fecha, se muestra como «h antes de la intervención»', () => {
    const ay = ayunoQrDesde(calcularAyuno({ induccion: IV, pediatrico: false, situacion: 'ninguna' }), false, 'ninguna');
    const lineas = renderAyuno(ay, null, T);
    const copiosa = lineas.find((l) => l.etiqueta === 'Comida copiosa');
    expect(copiosa?.cuando).toContain('8 h antes');
  });
});
