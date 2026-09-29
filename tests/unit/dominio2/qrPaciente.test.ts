import { describe, it, expect } from '../../_harness.ts';
import { serializar, deserializar, cabeEnQr, type Payload } from '../../../src/dominio/salidas/qr/serializar.ts';
import {
  recalcularHoja,
  caducidadQrPaciente,
  type ContenidoQrPaciente,
} from '../../../src/dominio/salidas/qr/hojaPaciente.ts';

// Intervención de referencia: jueves 15/10/2026 08:00 (la del informe de casos).
const IV = new Date(2026, 9, 15, 8, 0);
const IV_MS = IV.getTime();
// "Ahora" para el recálculo: bastante antes de los plazos, para que los casos de
// referencia se puedan cumplir (no dispara el aviso de plazo no alcanzable).
const AHORA_LEJANO = new Date(2026, 9, 1, 8, 0);

const TEL = '000 000 000';

// Contenido del QR con los seis casos de referencia (A1, A10, C6, D2, E1, B2).
// Los metadatos (tipo de plazo, duración, horas, adelanto, anticoagulante) son los
// que la hoja del paciente necesita para recalcular con las mismas reglas del motor.
function contenido(fi: number | null): ContenidoQrPaciente {
  return {
    tel: TEL,
    fi,
    far: [
      // A1 apixabán: plazo en horas 48, pauta 09:00/21:00, anticoagulante con adelanto.
      { n: 'Eliquis', pt: 'horas', pd: 48, hh: ['09:00', '21:00'], ad: true, ac: true, rc: false },
      // A10 warfarina: plazo en días 5, pauta 18:00, sin adelanto.
      { n: 'Aldocumar', pt: 'dias', pd: 5, hh: ['18:00'], ad: false, ac: true, rc: false },
      // C6 clopidogrel: plazo en días 5, pauta 09:00, requiere confirmación (aquí, ya confirmado
      // para poder comprobar el cálculo del plazo; la confirmación se prueba aparte).
      { n: 'Plavix', pt: 'dias', pd: 5, hh: ['09:00'], ad: false, ac: false, rc: true, cf: 'Dra. Ruiz' },
      // D2 empagliflozina: plazo en días 3, pauta 09:00.
      { n: 'Jardiance', pt: 'dias', pd: 3, hh: ['09:00'], ad: false, ac: false, rc: false },
      // D2 metformina: no tomar el día de la intervención, pauta 09:00/21:00.
      { n: 'Dianben', pt: 'no_dia_iq', hh: ['09:00', '21:00'], ad: false, ac: false, rc: false },
      // E1 enalapril: no tomar el día de la intervención, pauta 09:00.
      { n: 'Renitec', pt: 'no_dia_iq', hh: ['09:00'], ad: false, ac: false, rc: false },
      // B2 enoxaparina profiláctica: plazo en horas 12, pauta 21:00, anticoagulante con adelanto.
      { n: 'Clexane', pt: 'horas', pd: 12, hh: ['21:00'], ad: true, ac: true, rc: false },
    ],
  };
}

describe('QR del paciente §8.16 — codificación/decodificación/tamaño', () => {
  it('serializa y deserializa el contenido sin pérdida', async () => {
    const c = contenido(IV_MS);
    const creacion = new Date(2026, 9, 1);
    const payload: Payload = {
      t: 'paciente',
      e: 1,
      v: '0.1.0',
      c: creacion.getTime(),
      x: caducidadQrPaciente(creacion, IV),
      d: c,
    };
    const cadena = await serializar(payload);
    const res = await deserializar(cadena, AHORA_LEJANO, '0.1.0');
    expect(res.estado).toBe('ok');
    if (res.estado === 'ok') {
      const d = res.payload.d as ContenidoQrPaciente;
      expect(d.tel).toBe(TEL);
      expect(d.fi).toBe(IV_MS);
      expect(d.far.length).toBe(7);
      expect(d.far[0]?.n).toBe('Eliquis');
      expect(d.far[0]?.pt).toBe('horas');
      expect(d.far[0]?.ad).toBe(true);
    }
  });

  it('cabe en un QR (tamaño dentro de la capacidad práctica)', async () => {
    const c = contenido(IV_MS);
    const payload: Payload = { t: 'paciente', e: 1, v: '0.1.0', c: Date.now(), x: caducidadQrPaciente(new Date(), IV), d: c };
    const cadena = await serializar(payload);
    expect(cabeEnQr(cadena)).toBe(true);
  });

  it('caducidad: sin fecha = creación + 90 días; con fecha = intervención + 30 días', () => {
    const creacion = new Date(2026, 9, 1);
    const sinFecha = caducidadQrPaciente(creacion, null);
    expect(sinFecha).toBe(creacion.getTime() + 90 * 86_400_000);
    const conFecha = caducidadQrPaciente(creacion, IV);
    expect(conFecha).toBe(IV_MS + 30 * 86_400_000);
  });
});

describe('QR del paciente §8.16 — recálculo SIN fecha (márgenes, sin adelantos)', () => {
  const inst = recalcularHoja(contenido(null), null, AHORA_LEJANO);
  const por = (n: string) => inst.find((i) => i.nombre === n);

  it('plazo en días → margen en días', () => {
    expect(por('Aldocumar')?.texto).toContain('los 5 días anteriores a la intervención ni ese mismo día');
    expect(por('Jardiance')?.texto).toContain('los 3 días anteriores');
  });
  it('plazo en horas → margen mínimo en horas (sin adelanto)', () => {
    expect(por('Eliquis')?.texto).toContain('como mínimo 48 horas antes');
    expect(por('Clexane')?.texto).toContain('como mínimo 12 horas antes');
  });
  it('no tomar el día de la intervención se mantiene igual', () => {
    expect(por('Renitec')?.texto).toContain('No lo tome el día de la intervención');
    expect(por('Dianben')?.texto).toContain('No lo tome el día de la intervención');
  });
  it('sin fecha, ningún plazo se marca como no cumplible', () => {
    expect(inst.every((i) => !i.plazoNoCumplible)).toBe(true);
  });
});

describe('QR del paciente §8.16 — recálculo CON fecha = mismas fechas del informe', () => {
  const inst = recalcularHoja(contenido(IV_MS), IV, AHORA_LEJANO);
  const por = (n: string) => inst.find((i) => i.nombre === n);

  it('A1 apixabán: adelanta a martes 13 a las 08:00', () => {
    expect(por('Eliquis')?.texto).toContain('martes 13 de octubre');
    expect(por('Eliquis')?.texto).toContain('08:00');
    // Margen entre paréntesis (§8.16c).
    expect(por('Eliquis')?.texto).toContain('como mínimo 48 horas antes de la intervención');
  });
  it('A10 warfarina: última toma viernes 9 a las 18:00', () => {
    expect(por('Aldocumar')?.texto).toContain('viernes 9 de octubre');
    expect(por('Aldocumar')?.texto).toContain('18:00');
    expect(por('Aldocumar')?.texto).toContain('como mínimo 5 días antes');
  });
  it('C6 clopidogrel: última toma viernes 9 a las 09:00', () => {
    expect(por('Plavix')?.texto).toContain('viernes 9 de octubre');
    expect(por('Plavix')?.texto).toContain('09:00');
  });
  it('D2 empagliflozina: última toma domingo 11 a las 09:00; metformina miércoles 14', () => {
    expect(por('Jardiance')?.texto).toContain('domingo 11 de octubre');
    expect(por('Dianben')?.texto).toContain('No lo tome el día de la intervención');
  });
  it('E1 enalapril: no tomar el día de la intervención', () => {
    expect(por('Renitec')?.texto).toContain('No lo tome el día de la intervención');
  });
  it('B2 enoxaparina: adelanta a miércoles 14 a las 20:00', () => {
    expect(por('Clexane')?.texto).toContain('miércoles 14 de octubre');
    expect(por('Clexane')?.texto).toContain('20:00');
  });
  it('ningún caso de referencia queda como no cumplible con la fecha de referencia', () => {
    expect(inst.every((i) => !i.plazoNoCumplible)).toBe(true);
  });
});

describe('QR del paciente §8.16/§12 — fármaco que requiere confirmación', () => {
  const FRASE = 'el anestesiólogo le llamará para indicarle qué hacer';
  // C6 clopidogrel portador de stent: requiere confirmación; plazo en días 5.
  function contenidoC6(cf?: string): ContenidoQrPaciente {
    const far = { n: 'Plavix', pt: 'dias' as const, pd: 5, hh: ['09:00'], ad: false, ac: false, rc: true, ...(cf ? { cf } : {}) };
    return { tel: TEL, fi: IV_MS, far: [far] };
  }

  it('SIN confirmar: aunque haya fecha, no muestra la pauta, sino la frase única §12', () => {
    const inst = recalcularHoja(contenidoC6(), IV, AHORA_LEJANO);
    const p = inst.find((i) => i.nombre === 'Plavix');
    expect(p?.texto).toContain(FRASE);
    expect(p?.texto).not.toContain('viernes 9 de octubre');
    expect(p?.plazoNoCumplible).toBe(false);
  });

  it('SIN confirmar y SIN fecha: también la frase única (no el margen)', () => {
    const c = contenidoC6();
    c.fi = null;
    const inst = recalcularHoja(c, null, AHORA_LEJANO);
    const p = inst.find((i) => i.nombre === 'Plavix');
    expect(p?.texto).toContain(FRASE);
    expect(p?.texto).not.toContain('días anteriores');
  });

  it('CONFIRMADO: muestra la pauta calculada (última toma viernes 9 a las 09:00)', () => {
    const inst = recalcularHoja(contenidoC6('Dra. Ruiz'), IV, AHORA_LEJANO);
    const p = inst.find((i) => i.nombre === 'Plavix');
    expect(p?.texto).toContain('viernes 9 de octubre');
    expect(p?.texto).toContain('09:00');
    expect(p?.texto).not.toContain(FRASE);
  });
});

describe('QR del paciente §8.16 — recálculo con fecha demasiado cercana', () => {
  it('clopidogrel con intervención dentro de 2 días: sin pauta y remite al teléfono', () => {
    // "Ahora" = lunes 12/10; intervención el miércoles 14/10 (dentro de 2 días).
    // El plazo de 5 días exige la última toma el jueves 8/10, que ya pasó → no cumplible.
    const ahora = new Date(2026, 9, 12, 8, 0);
    const ivCercana = new Date(2026, 9, 14, 8, 0);
    const c: ContenidoQrPaciente = {
      tel: TEL,
      fi: ivCercana.getTime(),
      // Confirmado (cf): así el recálculo llega al cálculo y detecta el plazo no cumplible.
      far: [{ n: 'Plavix', pt: 'dias', pd: 5, hh: ['09:00'], ad: false, ac: false, rc: true, cf: 'Dra. Ruiz' }],
    };
    const inst = recalcularHoja(c, ivCercana, ahora);
    const plavix = inst.find((i) => i.nombre === 'Plavix');
    expect(plavix?.plazoNoCumplible).toBe(true);
    expect(plavix?.texto).toContain('ya no es posible seguir la pauta de Plavix');
    expect(plavix?.texto).toContain(TEL);
  });
});
