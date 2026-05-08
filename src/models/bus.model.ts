import { Bus } from "./types";

export const busesData: Bus[] = [
  {
    id: 1,
    placa: "ABC-419",
    latitud: -12.057812,
    longitud: -77.082041,
    id_ruta: "sur",
    conductor: "Juan Perez",
    capacidad: 16,
    estado: "activo",
  },
  {
    id: 2,
    placa: "TRK-258",
    latitud: -12.056102,
    longitud: -77.087214,
    id_ruta: "norte",
    conductor: "Maria Lopez",
    capacidad: 20,
    estado: "activo",
  },
  {
    id: 3,
    placa: "QWE-774",
    latitud: -12.054238,
    longitud: -77.085102,
    id_ruta: "centro",
    conductor: "Carlos Diaz",
    capacidad: 18,
    estado: "mantenimiento",
  },
  {
    id: 4,
    placa: "MNO-913",
    latitud: -12.056944,
    longitud: -77.084321,
    id_ruta: "este",
    conductor: "Ana Ruiz",
    capacidad: 14,
    estado: "inactivo",
  },
];
