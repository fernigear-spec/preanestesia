/**
 * Sugammadex y anticoncepción hormonal — docs/documento_fuente.md §8.15 (Decisión 11).
 * En toda mujer con cualquier anticonceptivo hormonal y posible anestesia general,
 * la hoja del paciente incluye, de forma CONDICIONAL ("si durante la anestesia se
 * usa sugammadex"):
 *  - Anticonceptivo oral: equivale a olvidar una toma → seguir "dosis olvidada".
 *  - Anticonceptivo hormonal no oral (implante, anillo, parche, DIU hormonal):
 *    método de barrera adicional durante 7 días.
 * Las notas del anestesiólogo recuerdan informar a la paciente al alta si se usó.
 *
 * No es una "acción sobre un fármaco" al uso: produce un aviso condicional para
 * la hoja del paciente y una nota para el anestesiólogo.
 */

export type TipoAnticonceptivoHormonal = 'oral' | 'no_oral';

export interface EntradaSugammadex {
  /** true si la paciente es mujer con anticonceptivo hormonal. */
  mujerConAnticonceptivoHormonal: boolean;
  tipo: TipoAnticonceptivoHormonal;
  /** true si hay posibilidad de anestesia general. */
  posibleAnestesiaGeneral: boolean;
}

export interface AvisoSugammadex {
  /** true si procede mostrar el aviso condicional. */
  aplica: boolean;
  /** Texto condicional para la hoja del paciente (vacío si no aplica). */
  textoPaciente: string;
  /** Nota para el anestesiólogo (vacío si no aplica). */
  textoAnestesiologo: string;
}

const FUENTE = 'docs/documento_fuente.md §8.15 (ficha técnica de sugammadex)';

/**
 * ¿Un fármaco es un anticonceptivo HORMONAL (no THS)? La terapia hormonal
 * sustitutiva no es anticonceptiva y NO debe disparar el aviso del sugammadex.
 * Se distingue por el id del catálogo: los anticonceptivos empiezan por
 * «anticonceptivo_»; la THS, por «ths».
 */
export function esAnticonceptivoHormonal(idFarmaco: string): boolean {
  return idFarmaco.startsWith('anticonceptivo_');
}

/** Vías consideradas «orales» para el aviso del sugammadex (toma por boca). */
export function esViaOralSugammadex(via: string): boolean {
  return via === 'oral';
}

/**
 * Determina el aviso de sugammadex para la HOJA DEL PACIENTE a partir de la
 * medicación y la posibilidad de anestesia general. Devuelve 'oral' | 'no_oral'
 * según la vía del anticonceptivo hormonal, o undefined si no procede.
 */
export function sugammadexParaHoja(
  medicacion: Array<{ idFarmaco: string; via: string }>,
  posibleAnestesiaGeneral: boolean,
): 'oral' | 'no_oral' | undefined {
  if (!posibleAnestesiaGeneral) return undefined;
  const anticon = medicacion.find((f) => esAnticonceptivoHormonal(f.idFarmaco));
  if (!anticon) return undefined;
  return esViaOralSugammadex(anticon.via) ? 'oral' : 'no_oral';
}

export function avisoSugammadex(e: EntradaSugammadex): AvisoSugammadex {
  if (!e.mujerConAnticonceptivoHormonal || !e.posibleAnestesiaGeneral) {
    return { aplica: false, textoPaciente: '', textoAnestesiologo: '' };
  }

  const textoPaciente =
    e.tipo === 'oral'
      ? 'Si durante la anestesia se usa sugammadex, tenga en cuenta que equivale a olvidar una toma de su anticonceptivo: siga las instrucciones de «dosis olvidada» de su prospecto.'
      : 'Si durante la anestesia se usa sugammadex, use además un método de barrera (preservativo) durante los 7 días siguientes.';

  return {
    aplica: true,
    textoPaciente,
    textoAnestesiologo: `Informar a la paciente al alta si se ha usado sugammadex (anticonceptivo ${e.tipo}). ${FUENTE}.`,
  };
}
