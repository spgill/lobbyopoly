import { grommet } from "grommet";

console.warn("DEFAULT THEME", grommet);

export default {
  button: {
    border: {
      radius: "8px",
    },
  },
  global: {
    font: {
      family: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",

      weights: {
        thin: 100,
        extraLight: 200,
        light: 300,
        regular: 400,
        text: 450,
        medium: 500,
        semiBold: 600,
        bold: 700,
      },
    },
    colors: {
      brand: "#e1403e",
    },
  },
};
