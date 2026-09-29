/**
 * Banda fija y visible en todas las pantallas de la vista previa.
 * Requisito del servicio para el despliegue de la rama desarrollo en Pages.
 */
export function BandaPrueba() {
  return (
    <div className="banda-prueba" role="alert" aria-live="polite">
      VERSIÓN DE PRUEBA · NO USAR CON PACIENTES
    </div>
  );
}
