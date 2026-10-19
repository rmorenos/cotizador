# Cotizador · Pressure Washing · Louisville, KY

Sitio web estático para cotizar trabajos de pressure washing. Tiene una pestaña por tipo de trabajo:

- Gasolineras
- Edificios comerciales
- Casas
- Basura multifamiliar
- General

Cada pestaña calcula el precio, la ganancia por hora y arma la cotización en inglés para el cliente. Los datos se guardan en el navegador (localStorage), por separado en cada pestaña.

## Publicar con GitHub Pages

1. En GitHub, abre **Settings → Pages**.
2. En **Source**, elige **Deploy from a branch**.
3. Elige la rama `main` y la carpeta `/ (root)`, y guarda.
4. En uno o dos minutos el sitio queda en `https://rmorenos.github.io/cotizador/`.

Para abrir directo una pestaña: `#gas`, `#com`, `#casa`, `#basura` o `#general` al final del enlace.

## Archivos

- `index.html`: página, estilos y los datos de cada pestaña (`CONFIGS`: servicios, precios y recordatorios).
- `app.js`: lógica de pestañas y cálculos.

Para cambiar un precio por defecto, edita el valor `r` del servicio en `CONFIGS` dentro de `index.html`.
