/**
 * Privacidad del QR/enlace del paciente (§2, §11): la carga útil no contiene ningún
 * dato identificativo del paciente (ni el campo opcional de identificación impresa).
 */
import { describe, it, expect } from '../../_harness.ts';
import { construirContenidoQrPaciente, payloadPaciente, type FarmacoPlan } from '../../../src/dominio/salidas/qr/construirContenido.ts';
import { serializar, deserializar } from '../../../src/dominio/salidas/qr/serializar.ts';

const IV = new Date(2026, 9, 15, 8, 0);

describe('§11 · privacidad del QR del paciente', () => {
  it('la carga útil no contiene datos identificativos', async () => {
    const plan: FarmacoPlan[] = [{
      resultado: { idFarmaco: 'apixaban', nombreComercial: 'Eliquis', principiosActivos: ['apixaban'], accion: 'suspender', textoPaciente: 'x', reglaAplicada: 'r', fuente: 'f', requiereConfirmacion: false },
      horas: ['09:00'], meta: { pt: 'horas', pd: 48, ad: true, ac: true },
    }];
    const contenido = construirContenidoQrPaciente(plan, '900123456', IV);
    const payload = payloadPaciente(contenido, '0.1.0', new Date(2026, 9, 1), IV.getTime());

    const cadena = await serializar(payload);
    const r = await deserializar(cadena, new Date(2026, 9, 2), '0.1.0');
    expect(r.estado).toBe('ok');
    const json = JSON.stringify(r.estado === 'ok' ? r.payload : {});

    // Ningún campo ni valor identificativo (nombre de paciente, NHC, DNI, identificación impresa).
    expect(/identificaci|historia|apellido|\bdni\b|\bnhc\b|paciente_nombre/i.test(json)).toBeFalse();
    // Solo viaja el teléfono del servicio y los datos clínicos estructurados.
    expect(json).toContain('900123456');
  });
});
