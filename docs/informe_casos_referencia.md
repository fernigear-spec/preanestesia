# Informe de casos de referencia (ejecución del motor)

> Generado automáticamente por `scripts/generar-informe-casos.ts` ejecutando el MOTOR con la entrada de cada caso de `docs/casos_referencia.md`.
> Los valores de la columna "Motor" salen de la ejecución del motor, no de las aserciones de las pruebas.
> Intervención de referencia: jueves 15/10/2026 a las 08:00 (salvo A2b y A3b: 13:00).

**Resultado: 82/82 casos coinciden con lo esperado.**

| Caso | Motor (cálculo) | Texto del paciente | Esperado | ¿Coincide? |
|---|---|---|---|---|
| A1 | acción: suspender; última toma: mar 13/10 08:00; CHA2DS2-VA 2; nota: Podría considerarse suspender solo 24 h. | El martes 13 de octubre, tome la dosis a las 08:00 en lugar de a las 09:00. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen. | 48 h; adelantar mar 13/10 09:00→08:00; nota 24 h; CHA2DS2-VA 2 | ✅ |
| A2 | acción: suspender; última toma: lun 12/10 08:00 | El lunes 12 de octubre, tome la dosis a las 08:00 en lugar de a las 09:00. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen. | 72 h; adelantar lun 12/10 09:00→08:00; sin nota 24 h | ✅ |
| A2b | acción: suspender; última toma: mar 13/10 09:00 | Tome la última dosis el martes 13 de octubre a las 09:00. Después no vuelva a tomarlo hasta que se lo indiquen. | no adelanta; última mar 13/10 09:00 | ✅ |
| A3 | acción: suspender; última toma: sáb 10/10 21:00 | Tome la última dosis el sábado 10 de octubre a las 21:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 96 h; no adelanta; última sáb 10/10 21:00 | ✅ |
| A3b | acción: suspender; última toma: lun 12/10 13:00 | El lunes 12 de octubre, tome la dosis a las 13:00 en lugar de a las 21:00. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen. | adelantar lun 12/10 21:00→13:00 | ✅ |
| A4 | acción: suspender; última toma: lun 12/10 08:00 | El lunes 12 de octubre, tome la dosis a las 08:00 en lugar de a las 09:00. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen. | 72 h; adelantar lun 12/10 09:00→08:00 | ✅ |
| A5 | acción: suspender; última toma: dom 11/10 08:00 | El domingo 11 de octubre, tome la dosis a las 08:00 en lugar de a las 09:00. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen. | 96 h; adelantar dom 11/10 09:00→08:00 | ✅ |
| A6 | acción: suspender; última toma: sáb 10/10 08:00 | El sábado 10 de octubre, tome la dosis a las 08:00 en lugar de a las 09:00. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen. | 120 h; adelantar sáb 10/10 09:00→08:00 | ✅ |
| A7 | acción: consultar; última toma: —; requiere confirmación; falta: aclaramiento de creatinina | Sobre este anticoagulante, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta. | requiere confirmación; falta aclaramiento | ✅ |
| A8 | acción: consultar; última toma: —; requiere confirmación | Sobre este anticoagulante, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta. | alerta ictus; confirmación con cambio a acenocumarol | ✅ |
| A9 | acción: suspender; última toma: dom 11/10 18:00 | Tome la última dosis el domingo 11 de octubre a las 18:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 3 días; última dom 11/10 18:00; sin puente | ✅ |
| A10 | acción: suspender; última toma: vie 09/10 18:00 | Tome la última dosis el viernes 9 de octubre a las 18:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 5 días; última vie 09/10 18:00; sin puente | ✅ |
| A11 | acción: consultar; última toma: vie 09/10 18:00; requiere confirmación | Sobre este anticoagulante, el anestesiólogo le confirmará qué hacer. No lo cambie por su cuenta. | confirmación por válvula mecánica; sin puente | ✅ |
| A12 | acción: consultar; última toma: dom 11/10 18:00; requiere confirmación; puente enoxaparina 70 mg/24 h | Sobre este anticoagulante, el anestesiólogo le llamará para indicarle cómo hacer el cambio. No lo modifique por su cuenta. | puente enoxaparina 70 mg/24 h; confirmación | ✅ |
| A13 | acción: suspender; última toma: dom 11/10 18:00 | Tome la última dosis el domingo 11 de octubre a las 18:00. Después no vuelva a tomarlo hasta que se lo indiquen. | suspender 3 días (no mantener); última dom 11/10 18:00 | ✅ |
| B1 | acción: suspender; última toma: mié 14/10 18:00 | Tome la última dosis el miércoles 14 de octubre a las 18:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 12 h; última mié 14/10 18:00 | ✅ |
| B3 | clasificación: terapeutica; acción: suspender; última toma: mié 14/10 08:00 | El miércoles 14 de octubre, tome la dosis a las 08:00 en lugar de a las 09:00. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen. | terapéutica; 24 h; adelantar mié 14/10 09:00→08:00 | ✅ |
| B4 | acción: suspender; última toma: mar 13/10 09:00 | Tome la última dosis el martes 13 de octubre a las 09:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 36 h; no adelanta; última mar 13/10 09:00 | ✅ |
| B5 | acción: suspender; última toma: lun 12/10 08:00 | El lunes 12 de octubre, tome la dosis a las 08:00 en lugar de a las 09:00. Será la última. Después no vuelva a tomarlo hasta que se lo indiquen. | 72 h; adelantar lun 12/10 09:00→08:00 | ✅ |
| C1 | acción: mantener; última toma: — | Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua. | mantener | ✅ |
| C2 | acción: consultar; última toma: —; requiere confirmación | Sobre este medicamento, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta. | requiere confirmación | ✅ |
| C3 | acción: suspender; última toma: mié 07/10 09:00 | Tome la última dosis el miércoles 7 de octubre a las 09:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 7 días; última mié 07/10 09:00 | ✅ |
| C4 | acción: consultar; última toma: —; requiere confirmación | Sobre este medicamento, el anestesiólogo le confirmará qué hacer. No lo cambie por su cuenta. | confirmación + sugerencia 100 mg | ✅ |
| C5 | stent reciente: true; sin pauta en hoja: true; alerta: roja | (hoja del paciente sin pauta de antiagregantes) | alerta roja diferir; confirmación; sin pauta en hoja | ✅ |
| C6 | stent reciente: false; acción: suspender; última toma: vie 09/10 09:00 | Tome la última dosis el viernes 9 de octubre a las 09:00. Después no vuelva a tomarlo hasta que se lo indiquen. | no reciente; clopidogrel 5 días (vie 09/10 09:00) | ✅ |
| C7 | acción: consultar; última toma: mié 07/10 09:00; requiere confirmación | Tome la última dosis el miércoles 7 de octubre a las 09:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 7 días; última mié 07/10 09:00; confirmación | ✅ |
| C8 | acción: suspender; última toma: mié 07/10 21:00 | Tome la última dosis el miércoles 7 de octubre a las 21:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 7 días; última mié 07/10 21:00 | ✅ |
| C9 | acción: mantener; última toma: — | Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua. | mantener | ✅ |
| C10 | acción: suspender; última toma: dom 11/10 21:00 | Tome la última dosis el domingo 11 de octubre a las 21:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 3 días; última dom 11/10 21:00 | ✅ |
| D2 | empagliflozina: dom 11/10 09:00; metformina: mié 14/10 21:00 | Tome la última dosis el domingo 11 de octubre a las 09:00. Después no vuelva a tomarlo hasta que se lo indiquen. // No la tome el día de la intervención. Su última toma será el miércoles 14 de octubre a las 21:00. | empagliflozina dom 11/10 09:00; metformina mié 14/10 21:00 | ✅ |
| D3 | acción: suspender; última toma: sáb 10/10 09:00 | Tome la última dosis el sábado 10 de octubre a las 09:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 4 días; última sáb 10/10 09:00 | ✅ |
| D4 | acción: suspender | No se ponga la dosis del lunes 12 de octubre. Además, dieta de líquidos claros durante las 24 h previas a la intervención (siga la hoja adjunta). | omitir dosis del lunes 12/10; dieta líquida 24 h | ✅ |
| D5 | dosis jue 15/10: suspender; dosis jue 08/10: mantener | No se ponga la dosis del jueves 15 de octubre. Además, dieta de líquidos claros durante las 24 h previas a la intervención (siga la hoja adjunta). | se omite jue 15/10; la de jue 08/10 (7 días) se administra | ✅ |
| D6 | acción: suspender; última toma: dom 11/10 08:00 | Deje de tomarlo los 3 días previos y el día de la intervención. Tome la última dosis el domingo 11 de octubre a las 08:00. Después no vuelva a tomarlo hasta que se lo indiquen. | última dom 11/10 | ✅ |
| D7 | mañana: 22 UI (70-80 %) | Póngase 22 UI la noche previa y 22 UI la mañana de la intervención (75 % de su dosis habitual). | mañana 21-24 UI (70-80 % de 30) | ✅ |
| D8 | noche: 10 UI (completa); mañana: 10 UI (50 %) | Póngase su dosis completa (10 UI) la noche previa y 10 UI (la mitad) la mañana de la intervención. | noche 10 UI completa; mañana 10 UI (50 %) | ✅ |
| D9 | mañana: 10 UI (50 %) | Póngase 10 UI (la mitad de su dosis habitual) la mañana de la intervención. | mañana 10 UI (50 % de 20) | ✅ |
| D10 | acción: ajustar; última toma: — | Ponga la basal al 70-80 % de lo habitual y no se administre bolos el día de la intervención. | basal 70-80 %, sin bolos; sin confirmación | ✅ |
| D11 | acción: consultar; última toma: —; requiere confirmación | Sobre su bomba de insulina, el anestesiólogo le indicará qué hacer. No cambie la pauta por su cuenta. | requiere confirmación | ✅ |
| E1 | acción: suspender; última toma: mié 14/10 09:00 | No lo tome el día de la intervención (la toma de la noche anterior sí). Su última toma será el miércoles 14 de octubre a las 09:00. | no tomar el día; última mié 14/10 09:00 | ✅ |
| E1b | acción: suspender; última toma: mié 14/10 21:00 | No lo tome el día de la intervención (la toma de la noche anterior sí). Su última toma será el miércoles 14 de octubre a las 21:00. | no tomar el día; última mié 14/10 21:00 | ✅ |
| E2 | acción: mantener; última toma: — | Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua. | mantener | ✅ |
| E3 | acción: consultar; última toma: —; requiere confirmación | Sobre este medicamento, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta. | requiere confirmación | ✅ |
| E4 | acción: suspender; última toma: mié 14/10 09:00 | No tome la dosis de la mañana del día de la intervención. Su última toma será el miércoles 14 de octubre a las 09:00. | no la mañana; última mié 14/10 09:00 | ✅ |
| E5 | acción: suspender; última toma: lun 12/10 21:00 | Tome la última dosis el lunes 12 de octubre a las 21:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 48 h; última lun 12/10 21:00 | ✅ |
| E6 | acción: suspender; última toma: mar 13/10 21:00 | Tome la última dosis el martes 13 de octubre a las 21:00. Después no vuelva a tomarlo hasta que se lo indiquen. | 24 h; última mar 13/10 21:00; nota IMAO | ✅ |
| E7 | acción: consultar; última toma: —; requiere confirmación | Sobre este medicamento, el anestesiólogo (con su psiquiatra) le indicará qué hacer. No lo cambie por su cuenta. | confirmación; nota IMAO | ✅ |
| E8 | acción: mantener; última toma: — | Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua. | mantener; nota | ✅ |
| E9 | acción: suspender; última toma: mié 14/10 08:00 | Tome la última dosis el miércoles 14 de octubre a las 08:00. Después no vuelva a tomarlo hasta que se lo indiquen. Si necesita analgesia esos días puede tomar paracetamol o metamizol. | 24 h; última mié 14/10 08:00 (en el límite) | ✅ |
| E10 | acción: suspender; última toma: dom 11/10 21:00 | Tome la última dosis el domingo 11 de octubre a las 21:00. Después no vuelva a tomarlo hasta que se lo indiquen. Si necesita analgesia esos días puede tomar paracetamol o metamizol. | 72 h; última dom 11/10 21:00 (AINE no adelanta) | ✅ |
| E11 | acción: mantener; última toma: — | Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua. | mantener | ✅ |
| E12 | acción: consultar; última toma: —; requiere confirmación; falta: fecha de la última dosis del biológico | Sobre este tratamiento biológico, el anestesiólogo le indicará qué hacer. No lo cambie por su cuenta. | confirmación (planificación por ciclo) | ✅ |
| E13 | acción: consultar; última toma: —; requiere confirmación; alerta: Antiangiogénico sistémico reciente: retrasar la cirugía programada al menos 6-8 semanas desde la última dosis. | Sobre este tratamiento, el anestesiólogo le indicará qué hacer. No lo cambie por su cuenta. | alerta diferir 6-8 semanas; confirmación | ✅ |
| E14 | acción: mantener; última toma: — | Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua. | mantener | ✅ |
| E15 | acción: suspender; última toma: mié 30/09 09:00 | Deje de tomarlo 14 días antes si es posible (mínimo 7). Tome la última dosis el miércoles 30 de septiembre a las 09:00. Después no vuelva a tomarlo hasta que se lo indiquen. | suspender 14 días (mínimo 7); última mié 30/09 09:00 | ✅ |
| E16 | acción: consultar; última toma: —; requiere confirmación; sugammadex: Si durante la anestesia se usa sugammadex, tenga en cuenta que equivale a olvidar una toma de su anticonceptivo: siga las instrucciones de «dosis olvidada» de su prospecto. | Sobre su anticonceptivo, el anestesiólogo le llamará para indicarle qué hacer. No lo cambie por su cuenta. | confirmación; sugammadex oral (dosis olvidada) | ✅ |
| E17 | acción: mantener; última toma: —; sugammadex: barrera 7 días=true | Siga tomándolo como siempre, también el día de la intervención, con un sorbo de agua. | sin regla trombótica; sugammadex no oral (barrera 7 días) | ✅ |
| F1 | STOP-Bang 6 (alto) | — | 6, riesgo alto | ✅ |
| F2 | STOP-Bang 2 (bajo) | — | 2, riesgo bajo | ✅ |
| F3 | Apfel 4 (80 %) | — | 4, 80 % | ✅ |
| F4 | CHA2DS2-VA 4 | — | 4 | ✅ |
| F5 | DASI 24.2; METs 5.72; reducida true | — | DASI 24,2; capacidad reducida | ✅ |
| F6 | varón 41.7; mujer 35.4 | — | 42; 35 | ✅ |
| F7 | 4AT 2 (posible_deterioro_cognitivo) | — | 2, posible deterioro | ✅ |
| F8 | 4AT 4 (posible_delirium) | — | 4, posible delirium | ✅ |
| F9 | EGRI parcial 3 | — | 3 | ✅ |
| F10 | Langeron 3 (riesgo) | — | 3, riesgo | ✅ |
| F11 | 140 mg/día (alerta_alta) | — | 140 mg/día, alerta alta | ✅ |
| F12 | AUDIT-C 3 (positivo) | — | positivo sin abstinencia | ✅ |
| F13 | HEMSTOP 2 (positivo (≥ 2)); pedir coagulación: true; alerta: amarilla | — | positivo → coagulación + alerta | ✅ |
| G1 | pruebas: bioquimica, coagulacion, ecg, hemograma | — | hemograma, coagulación, bioquímica, ECG; sin Rx | ✅ |
| G2 | pruebas: coagulacion, hemograma | — | hemograma y coagulación | ✅ |
| G3 | pruebas: bioquimica, coagulacion, ecg, hemograma, rx_torax; ECG vigente: true; coagulación vigente: false | — | +Rx; ECG vigente no se repite; coagulación caducada sí | ✅ |
| H1 | ligera 02:00; claros libres 04:00; carbohidratos true | — | ligera 02:00; claros 04:00; bebida carbohidratos | ✅ |
| H2 | fórmula/sólidos 02:00; materna 05:00; claros 07:00 | — | sólidos 02:00; materna 05:00; claros 07:00 | ✅ |
| H3 | fórmula 04:00; aviso hipoglucemia true | — | fórmula 04:00; aviso hipoglucemia | ✅ |
| H4 | sólidos 00:00; carbohidratos false; alerta metoclopramida true | — | sólidos 00:00 (8 h); sin carbohidratos; alerta metoclopramida | ✅ |
| I1 | alerta: informativa — variante m.11232T>C ausente; decisión del anestesiólogo. | El anestesiólogo hablará con usted sobre este punto antes de la intervención. | informativa (variante ausente) | ✅ |
| I2 | alerta: roja | El anestesiólogo hablará con usted sobre este punto antes de la intervención. | alerta roja | ✅ |
| I3 | alerta: informativa | El anestesiólogo hablará con usted sobre este punto antes de la intervención. | sin alerta roja (no línea materna) | ✅ |
| I4 | tarjeta: farmaco_a_enfermedad | Prednisona suele tomarse por trasplante, artritis_reumatoide, lupus, asma_epoc y insuficiencia_suprarrenal. Pregúntele por qué lo toma. | tarjeta de coherencia; no marca enfermedad | ✅ |
| I5 | tarjetas: 1 | SAOS sin CPAP. Pregunte si lo ha dejado, se lo retiraron o se ha olvidado de mencionarlo. | tarjeta inversa (preguntar por CPAP) | ✅ |

## Casos pendientes (módulos del flujo de entrevista aún no construidos)

- D1 (Synjardy): cubierto en `tests/unit/reglas/reglas2.test.ts` (combinación fija).
- Las consecuencias clínicas de todos los casos que dependían de insulinas (D7-D9) y HEMSTOP (F13) ya están implementadas y verificadas arriba.
