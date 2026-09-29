/// <reference types="vite/client" />

// Importación de ficheros CSV (y otros) como texto con el sufijo ?raw de Vite.
declare module '*?raw' {
  const contenido: string;
  export default contenido;
}
