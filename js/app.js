"use strict";

/* SIMTELE-WEB: todos los valores y umbrales son ficticios y didácticos. */

// Dos arreglos de objetos persistentes y un arreglo para las cinco mediciones.
const CLAVE_MANTENIMIENTO = "simtele_mantenimiento_v1";
const CLAVE_SENSORES = "simtele_sensores_v1";
const UMBRAL_DETENCION = 50; // Metros: umbral inventado, NO operativo.

// Rangos de sensores inventados para practicar validaciones (NO son valores reales).
const CONFIG_SENSORES = {
  temperatura: { nombre: "Temperatura", min: -20, max: 80, unidad: "°C" },
  tension: { nombre: "Tensión de cable", min: 0, max: 100, unidad: "kN" },
  vibracion: { nombre: "Vibración", min: 0, max: 20, unidad: "mm/s" },
  velocidad: { nombre: "Velocidad", min: 0, max: 60, unidad: "km/h" }
};

const ESTADOS_MANTENIMIENTO = ["normal", "revisión", "urgente"];
const PATRON_SENSOR = /^SEN-\d{3}$/;
const PATRON_NUMERO = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

/** Recupera registros guardados; devuelve un arreglo vacío si aún no hay datos. */
function cargarRegistros(clave) {
  try {
    const datos = JSON.parse(localStorage.getItem(clave) || "[]");
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.warn("No se pudieron recuperar los registros locales:", error);
    return [];
  }
}

/** Guarda un arreglo en el navegador sin provocar errores si el almacenamiento está bloqueado. */
function guardarRegistros(clave, registros) {
  try {
    localStorage.setItem(clave, JSON.stringify(registros));
    return true;
  } catch (error) {
    console.warn("No se pudieron guardar los registros locales:", error);
    return false;
  }
}

const registrosMantenimiento = cargarRegistros(CLAVE_MANTENIMIENTO).filter(
  (item) => item && typeof item.componente === "string" &&
    Number.isFinite(item.horas) && item.horas >= 0 &&
    ESTADOS_MANTENIMIENTO.includes(item.estado)
);
const registrosSensores = cargarRegistros(CLAVE_SENSORES).filter(
  (item) => item && typeof item.codigo === "string" && PATRON_SENSOR.test(item.codigo) &&
    CONFIG_SENSORES[item.tipo] && Number.isFinite(item.lectura) &&
    item.lectura >= CONFIG_SENSORES[item.tipo].min &&
    item.lectura <= CONFIG_SENSORES[item.tipo].max
);
const medicionesViento = [];

/** Convierte a número usando parseFloat, pero rechaza cadenas parciales o no numéricas. */
function leerNumero(valor) {
  const texto = valor.trim();
  if (texto === "" || !PATRON_NUMERO.test(texto)) return null;
  const numero = parseFloat(texto);
  return Number.isFinite(numero) ? numero : null;
}

/** Da un formato legible a los resultados sin alterar los cálculos originales. */
function formatearNumero(numero) {
  return numero.toLocaleString("es-BO", { maximumFractionDigits: 2 });
}

/** Escribe mensajes visibles y accesibles de éxito, advertencia o error. */
function mostrarMensaje(id, texto, tipo = "error") {
  const elemento = document.getElementById(id);
  elemento.textContent = texto;
  elemento.className = `feedback feedback--${tipo}`;
}

/** Construye una celda de tabla de forma segura (evita insertar HTML del usuario). */
function crearCelda(texto) {
  const celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

/** Agrega una fila vacía informativa cuando aún no existen registros. */
function mostrarTablaVacia(cuerpo, mensaje) {
  const fila = document.createElement("tr");
  const celda = crearCelda(mensaje);
  celda.colSpan = 4;
  celda.className = "empty-table";
  fila.appendChild(celda);
  cuerpo.appendChild(fila);
}

/** Módulo 1: calcula d = (v / 3.6) × t y compara con un umbral ficticio. */
function calcularDetencion(evento) {
  evento.preventDefault();

  const velocidad = leerNumero(document.getElementById("velocidad").value);
  const tiempo = leerNumero(document.getElementById("tiempo").value);
  const panel = document.getElementById("detencion-resultado");

  if (velocidad === null || velocidad <= 0) {
    panel.hidden = true;
    mostrarMensaje("detencion-mensaje", "Ingresa una velocidad numérica mayor que 0 km/h.");
    return;
  } else if (tiempo === null || tiempo <= 0) {
    panel.hidden = true;
    mostrarMensaje("detencion-mensaje", "Ingresa un tiempo de reacción numérico mayor que 0 segundos.");
    return;
  }

  const distancia = (velocidad / 3.6) * tiempo;
  if (!Number.isFinite(distancia)) {
    panel.hidden = true;
    mostrarMensaje("detencion-mensaje", "Los valores son demasiado grandes para calcular la distancia.");
    return;
  }

  document.getElementById("distancia-resultado").textContent = `${formatearNumero(distancia)} m`;
  panel.hidden = false;

  if (distancia > UMBRAL_DETENCION) {
    panel.dataset.state = "warning";
    document.getElementById("detencion-estado").textContent =
      "Aviso didáctico: la distancia supera los 50 m del umbral ficticio. No equivale a un diagnóstico operativo.";
    mostrarMensaje("detencion-mensaje", "Alerta de frenado prolongado (simulada).", "warning");
  } else {
    panel.dataset.state = "normal";
    document.getElementById("detencion-estado").textContent =
      "Estado didáctico normal: la distancia no supera el umbral ficticio de 50 m.";
    mostrarMensaje("detencion-mensaje", "Cálculo realizado correctamente.", "success");
  }
}

/** Módulo 2: renderiza el arreglo de mantenimiento en una tabla HTML. */
function renderizarMantenimiento() {
  const cuerpo = document.getElementById("tabla-mantenimiento");
  cuerpo.replaceChildren();

  if (registrosMantenimiento.length === 0) {
    mostrarTablaVacia(cuerpo, "Aún no hay componentes registrados.");
  } else {
    registrosMantenimiento.forEach((registro, indice) => {
      const fila = document.createElement("tr");
      fila.appendChild(crearCelda(registro.componente));
      fila.appendChild(crearCelda(`${formatearNumero(registro.horas)} h`));

      const celdaEstado = document.createElement("td");
      const etiqueta = document.createElement("span");
      etiqueta.className = `status status--${registro.estado === "revisión" ? "revision" : registro.estado}`;
      etiqueta.textContent = registro.estado.charAt(0).toUpperCase() + registro.estado.slice(1);
      celdaEstado.appendChild(etiqueta);
      fila.appendChild(celdaEstado);

      const celdaAccion = document.createElement("td");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "btn btn-delete";
      boton.textContent = "Eliminar";
      boton.dataset.indice = String(indice);
      boton.setAttribute("aria-label", `Eliminar componente ${registro.componente}`);
      celdaAccion.appendChild(boton);
      fila.appendChild(celdaAccion);
      cuerpo.appendChild(fila);
    });
  }
  document.getElementById("contador-mantenimiento").textContent = String(registrosMantenimiento.length);
}

/** Módulo 2: valida un componente y lo añade al arreglo mediante push(). */
function agregarMantenimiento(evento) {
  evento.preventDefault();
  const componente = document.getElementById("componente").value.trim();
  const horas = leerNumero(document.getElementById("horas").value);
  const estado = document.getElementById("estado").value;

  if (componente === "") {
    mostrarMensaje("mantenimiento-mensaje", "Escribe el nombre del componente.");
    return;
  } else if (horas === null || horas < 0) {
    mostrarMensaje("mantenimiento-mensaje", "Las horas de uso deben ser un número mayor o igual a 0.");
    return;
  } else if (!ESTADOS_MANTENIMIENTO.includes(estado)) {
    mostrarMensaje("mantenimiento-mensaje", "Selecciona un estado válido: normal, revisión o urgente.");
    return;
  }

  registrosMantenimiento.push({ componente, horas, estado });
  const guardado = guardarRegistros(CLAVE_MANTENIMIENTO, registrosMantenimiento);
  renderizarMantenimiento();
  evento.target.reset();
  mostrarMensaje("mantenimiento-mensaje", guardado
    ? "Componente agregado y guardado en este navegador."
    : "Componente agregado. El navegador no permitió guardarlo para futuras visitas.", guardado ? "success" : "warning");
}

/** Módulo 2: elimina una fila usando splice() y actualiza la tabla. */
function eliminarMantenimiento(evento) {
  const boton = evento.target.closest("button[data-indice]");
  if (!boton) return;
  const indice = Number(boton.dataset.indice);
  if (!Number.isInteger(indice) || indice < 0 || indice >= registrosMantenimiento.length) return;

  registrosMantenimiento.splice(indice, 1);
  const guardado = guardarRegistros(CLAVE_MANTENIMIENTO, registrosMantenimiento);
  renderizarMantenimiento();
  mostrarMensaje("mantenimiento-mensaje", guardado
    ? "Componente eliminado correctamente."
    : "Componente eliminado de la tabla, pero no se pudo actualizar el almacenamiento.", guardado ? "success" : "warning");
}

/** Módulo 3: valida cinco mediciones, calcula promedio y máximo con forEach. */
function analizarViento(evento) {
  evento.preventDefault();
  medicionesViento.length = 0;
  const entradas = document.querySelectorAll('input[name="viento"]');
  const panel = document.getElementById("viento-resultado");
  let indiceInvalido = -1;

  entradas.forEach((entrada, indice) => {
    const valor = leerNumero(entrada.value);
    const invalido = valor === null || valor < 0;
    entrada.setAttribute("aria-invalid", String(invalido));
    if (invalido && indiceInvalido === -1) indiceInvalido = indice;
    if (!invalido) medicionesViento.push(valor);
  });

  if (indiceInvalido !== -1 || medicionesViento.length !== 5) {
    panel.hidden = true;
    mostrarMensaje("viento-mensaje", `La medición ${indiceInvalido + 1} debe contener un número mayor o igual a 0 km/h.`);
    return;
  }

  let suma = 0;
  let maximo = medicionesViento[0];
  medicionesViento.forEach((valor) => {
    suma += valor;
    if (valor > maximo) maximo = valor;
  });
  const promedio = suma / medicionesViento.length;
  if (!Number.isFinite(suma) || !Number.isFinite(promedio)) {
    panel.hidden = true;
    mostrarMensaje("viento-mensaje", "Los valores son demasiado grandes para calcular el promedio.");
    return;
  }

  let clasificacion;
  let estado;
  // Clasificación basada en el máximo; todos los umbrales son inventados.
  if (maximo < 20) {
    clasificacion = "Operación normal (simulada)";
    estado = "normal";
  } else if (maximo < 40) {
    clasificacion = "Precaución por oscilación leve (simulada)";
    estado = "precaucion";
  } else {
    clasificacion = "Alerta de viento fuerte (simulada)";
    estado = "alerta";
  }

  document.getElementById("viento-promedio").textContent = `${formatearNumero(promedio)} km/h`;
  document.getElementById("viento-maximo").textContent = `${formatearNumero(maximo)} km/h`;
  document.getElementById("viento-clasificacion").textContent = clasificacion;
  document.querySelector(".result-classification").dataset.state = estado;
  panel.hidden = false;
  mostrarMensaje("viento-mensaje", "Se analizaron las cinco mediciones simuladas.", "success");
}

/** Módulo 4: actualiza el rango didáctico visible según el sensor seleccionado. */
function actualizarAyudaSensor() {
  const tipo = document.getElementById("sensor-tipo").value;
  const ayuda = document.getElementById("sensor-rango-ayuda");
  const lectura = document.getElementById("sensor-lectura");
  const config = CONFIG_SENSORES[tipo];

  if (!config) {
    ayuda.textContent = "Elige un tipo para consultar el rango didáctico.";
    lectura.removeAttribute("min");
    lectura.removeAttribute("max");
  } else {
    ayuda.textContent = `Rango ficticio: ${config.min} a ${config.max} ${config.unidad}. No es un límite real.`;
    lectura.min = String(config.min);
    lectura.max = String(config.max);
  }
}

/** Módulo 4: muestra solo sensores que han superado las validaciones. */
function renderizarSensores() {
  const cuerpo = document.getElementById("tabla-sensores");
  cuerpo.replaceChildren();

  if (registrosSensores.length === 0) {
    mostrarTablaVacia(cuerpo, "Aún no hay lecturas válidas registradas.");
  } else {
    registrosSensores.forEach((sensor, indice) => {
      const fila = document.createElement("tr");
      fila.appendChild(crearCelda(sensor.codigo));
      fila.appendChild(crearCelda(CONFIG_SENSORES[sensor.tipo].nombre));
      fila.appendChild(crearCelda(`${formatearNumero(sensor.lectura)} ${CONFIG_SENSORES[sensor.tipo].unidad}`));

      const accion = document.createElement("td");
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "btn btn-delete";
      boton.dataset.indice = String(indice);
      boton.textContent = "Eliminar";
      boton.setAttribute("aria-label", `Eliminar lectura del sensor ${sensor.codigo}`);
      accion.appendChild(boton);
      fila.appendChild(accion);
      cuerpo.appendChild(fila);
    });
  }
  document.getElementById("contador-sensores").textContent = String(registrosSensores.length);
}

/** Módulo 4: usa la expresión regular requerida y valida el rango de la lectura. */
function registrarSensor(evento) {
  evento.preventDefault();
  const codigo = document.getElementById("sensor-codigo").value.trim();
  const tipo = document.getElementById("sensor-tipo").value;
  const lectura = leerNumero(document.getElementById("sensor-lectura").value);

  // La prueba .test() exige SEN- seguido exactamente de tres dígitos.
  if (!PATRON_SENSOR.test(codigo)) {
    mostrarMensaje("sensores-mensaje", "Código inválido. Debe tener el formato SEN-001 (SEN- y exactamente 3 dígitos).");
    return;
  } else if (!Object.hasOwn(CONFIG_SENSORES, tipo)) {
    mostrarMensaje("sensores-mensaje", "Selecciona un tipo de sensor válido.");
    return;
  } else if (lectura === null) {
    mostrarMensaje("sensores-mensaje", "Ingresa una lectura numérica válida; no puede estar vacía.");
    return;
  }

  const config = CONFIG_SENSORES[tipo];
  if (lectura < config.min || lectura > config.max) {
    mostrarMensaje("sensores-mensaje", `Lectura fuera del rango didáctico para ${config.nombre}: ${config.min} a ${config.max} ${config.unidad}.`);
    return;
  }

  registrosSensores.push({ codigo, tipo, lectura });
  const guardado = guardarRegistros(CLAVE_SENSORES, registrosSensores);
  renderizarSensores();
  evento.target.reset();
  actualizarAyudaSensor();
  mostrarMensaje("sensores-mensaje", guardado
    ? "Lectura válida registrada y guardada en este navegador."
    : "Lectura válida registrada. El navegador no permitió guardar los datos.", guardado ? "success" : "warning");
}

/** Módulo 4: elimina una lectura guardada al pulsar su botón. */
function eliminarSensor(evento) {
  const boton = evento.target.closest("button[data-indice]");
  if (!boton) return;
  const indice = Number(boton.dataset.indice);
  if (!Number.isInteger(indice) || indice < 0 || indice >= registrosSensores.length) return;

  registrosSensores.splice(indice, 1);
  const guardado = guardarRegistros(CLAVE_SENSORES, registrosSensores);
  renderizarSensores();
  mostrarMensaje("sensores-mensaje", guardado
    ? "Lectura eliminada correctamente."
    : "Lectura eliminada de la tabla, pero no se pudo actualizar el almacenamiento.", guardado ? "success" : "warning");
}

// Todos los eventos se gestionan desde JavaScript, sin atributos onclick en HTML.
document.getElementById("form-detencion").addEventListener("submit", calcularDetencion);
document.getElementById("form-mantenimiento").addEventListener("submit", agregarMantenimiento);
document.getElementById("tabla-mantenimiento").addEventListener("click", eliminarMantenimiento);
document.getElementById("form-viento").addEventListener("submit", analizarViento);
document.getElementById("sensor-tipo").addEventListener("change", actualizarAyudaSensor);
document.getElementById("form-sensores").addEventListener("submit", registrarSensor);
document.getElementById("tabla-sensores").addEventListener("click", eliminarSensor);

// Muestra los registros previamente guardados al abrir o recargar la página.
renderizarMantenimiento();
renderizarSensores();
actualizarAyudaSensor();
