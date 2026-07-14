export type BusPosition = {
  busId: string;
  id_ruta?: RutaId;
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?: number;
  timestamp: string;
};

export type BusInfoItem = {
  etiqueta: string;
  valor: string;
};

export type RutaId = "sur" | "norte" | "centro" | "este";

export type BusEstado = "activo" | "inactivo" | "mantenimiento";

export type Ruta = {
  id: RutaId;
  nombre: string;
  origen: string;
  destino: string;
};

export type ParaderoSentido = "ida" | "vuelta";

export type Paradero = {
  id: number;
  nombre: string;
  latitud: number;
  longitud: number;
  idRuta: RutaId;
  sentido: ParaderoSentido;
  orden: number;
  esInicial: boolean;
};

export type Bus = {
  id: number;
  placa: string;
  latitud: number;
  longitud: number;
  id_ruta: RutaId;
  conductor: string;
  capacidad: number;
  estado: BusEstado;
};

export type Viaje = {
  id: number;
  id_paradero: number;
  id_bus: number;
  id_ruta: RutaId;
  fec_actu: string;
};
