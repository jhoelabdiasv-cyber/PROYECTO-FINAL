# TELEFERICO-WEB

**Panel interactivo de prevención y monitoreo de Mi Teleférico — simulación educativa.**

Proyecto de **Programación Web I** desarrollado con HTML5, CSS3 y JavaScript puro. Consiste en **una sola página** con cuatro módulos interactivos, navegación interna, tablas y validaciones.

> **Aviso:** Todos los datos, umbrales y rangos de este proyecto son ficticios y exclusivamente didácticos. **No** representan límites operativos reales, procedimientos de seguridad ni mediciones oficiales de Mi Teleférico.

## Integrantes del equipo

- Integrante 1: [Nombre completo]
- Integrante 2: [Nombre completo]
- Integrante 3: [Nombre completo]
- Integrante 4: [Nombre completo]

## Estructura

```text
proyecto-simtele-web/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── README.md
```

## Los cuatro módulos

1. **Detención de emergencia:** recibe velocidad (km/h) y tiempo de reacción (s), calcula `d = (v / 3.6) * t` y presenta un aviso comparando la distancia con un umbral didáctico de **50 m**.
2. **Mantenimiento:** registra componente, horas de uso (≥ 0) y estado (`normal`, `revisión` o `urgente`). Usa un arreglo de objetos, `push()`, tabla generada con el DOM y botones para eliminar usando `splice()`.
3. **Viento y oscilación:** recibe **cinco** mediciones (km/h), las guarda en un arreglo, calcula promedio y máximo con `forEach()` y clasifica según el **valor máximo**: menos de 20 = normal, desde 20 hasta menos de 40 = precaución y 40 o más = alerta. Son umbrales inventados.
4. **Sensores:** verifica códigos mediante `/^SEN-\d{3}$/`, valida tipo y lectura dentro de rangos didácticos y muestra solo registros válidos. Las lecturas también pueden eliminarse.

### Rangos ficticios de sensores

| Tipo | Intervalo aceptado (solo didáctico) |
| --- | --- |
| Temperatura | -20 a 80 °C |
| Tensión de cable | 0 a 100 kN |
| Vibración | 0 a 20 mm/s |
| Velocidad | 0 a 60 km/h |

Los registros de **mantenimiento y sensores** se guardan en `localStorage` y se recuperan al recargar la página, siempre que el navegador permita el almacenamiento local. Los cálculos de detención y viento no se guardan.

## Pruebas de aceptación

| Módulo | Datos de prueba | Resultado esperado |
| --- | --- | --- |
| Detención | `72` km/h y `3` s | `60 m` y aviso didáctico de alerta |
| Mantenimiento | Agregar dos componentes y eliminar uno | La tabla pasa de 2 filas de datos a 1 |
| Viento | `10, 20, 30, 40, 50` | Promedio `30 km/h`, máximo `50 km/h` |
| Sensores | `SEN-001`, Temperatura, `25` | Registro aceptado |
| Sensores | `SEN-1` | Error de código y ningún registro nuevo |
| Sensores | Código vacío | Error de código y ningún registro nuevo |
## Tecnologías utilizadas

- **HTML5 semántico:** `header`, `nav`, `main`, `section`, `footer`, `form`, `label`, `small` y `table`.
- **CSS3:** Flexbox, Grid, estados de alerta y `@media` para dispositivos móviles.
- **JavaScript:** `parseFloat()`, `if/else`, arreglos, objetos, `forEach()`, `push()`, `splice()`, expresiones regulares con `.test()`, `addEventListener`, manipulación segura del DOM y `localStorage`.
