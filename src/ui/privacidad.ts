/**
 * Privacidad (§2): la entrevista vive solo en memoria; no se guarda ningún dato del
 * paciente en el navegador. Este módulo añade dos protecciones:
 *  - Borrado automático tras un tiempo de inactividad (configurable, por defecto 30 min),
 *    con un aviso previo para poder seguir con el paciente.
 *  - Aviso al cerrar o recargar la pestaña mientras hay una entrevista en curso.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type FaseInactividad = 'activo' | 'aviso' | 'expirado';

/**
 * Fase de inactividad a partir del tiempo transcurrido sin actividad.
 * Función pura para poder probarla sin navegador.
 * @param transcurridoMs milisegundos desde la última actividad
 * @param limiteMs milisegundos hasta el borrado automático
 * @param avisoMs cuánto antes del límite debe aparecer el aviso
 */
export function faseInactividad(transcurridoMs: number, limiteMs: number, avisoMs: number): FaseInactividad {
  if (transcurridoMs >= limiteMs) return 'expirado';
  if (transcurridoMs >= limiteMs - avisoMs) return 'aviso';
  return 'activo';
}

const EVENTOS_ACTIVIDAD = ['mousedown', 'keydown', 'touchstart', 'pointerdown'] as const;

interface EstadoInactividad {
  /** El aviso de "vamos a borrar los datos" está visible. */
  avisoVisible: boolean;
  /** Segundos que faltan para el borrado (solo relevante durante el aviso). */
  segundosRestantes: number;
  /** El usuario indica que sigue con el paciente: reinicia el contador. */
  continuar: () => void;
}

/**
 * Borra la entrevista tras `limiteMs` sin actividad del usuario, avisando `avisoMs` antes.
 * @param activa si el temporizador debe estar en marcha (hay una entrevista en curso)
 * @param alExpirar acción de borrado (p. ej. reiniciar a la pantalla de inicio)
 */
export function useInactividad(
  activa: boolean,
  alExpirar: () => void,
  limiteMs: number,
  avisoMs = 60_000,
): EstadoInactividad {
  const [avisoVisible, setAvisoVisible] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const ultimaActividad = useRef(Date.now());
  const alExpirarRef = useRef(alExpirar);
  alExpirarRef.current = alExpirar;

  const continuar = useCallback(() => {
    ultimaActividad.current = Date.now();
    setAvisoVisible(false);
  }, []);

  useEffect(() => {
    if (!activa) {
      setAvisoVisible(false);
      return;
    }
    ultimaActividad.current = Date.now();
    const registrar = () => { ultimaActividad.current = Date.now(); };
    for (const ev of EVENTOS_ACTIVIDAD) window.addEventListener(ev, registrar, { passive: true });

    const intervalo = window.setInterval(() => {
      const transcurrido = Date.now() - ultimaActividad.current;
      const fase = faseInactividad(transcurrido, limiteMs, avisoMs);
      if (fase === 'expirado') {
        setAvisoVisible(false);
        alExpirarRef.current();
      } else if (fase === 'aviso') {
        setAvisoVisible(true);
        setSegundosRestantes(Math.max(0, Math.ceil((limiteMs - transcurrido) / 1000)));
      } else {
        setAvisoVisible(false);
      }
    }, 1000);

    return () => {
      for (const ev of EVENTOS_ACTIVIDAD) window.removeEventListener(ev, registrar);
      window.clearInterval(intervalo);
    };
  }, [activa, limiteMs, avisoMs]);

  return { avisoVisible, segundosRestantes, continuar };
}

/** Avisa al cerrar/recargar la pestaña mientras `activa` (entrevista en curso). */
export function useAvisoSalida(activa: boolean): void {
  useEffect(() => {
    if (!activa) return;
    const manejar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Los navegadores modernos muestran un mensaje genérico; basta con fijar returnValue.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', manejar);
    return () => window.removeEventListener('beforeunload', manejar);
  }, [activa]);
}
