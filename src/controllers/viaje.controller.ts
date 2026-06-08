import { Request, Response } from "express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Paradero, Viaje } from "../models/types";
import paraderosData from "../data/mock/paraderos.json";

const viajesJsonPath = path.resolve(process.cwd(), "src/data/mock/viajes.json");

type SentidoViaje = "ida" | "vuelta";
type ViajeConSentido = Viaje & { sentido: SentidoViaje | null };

function readViajesFromJson(): Viaje[] {
  const contenido = readFileSync(viajesJsonPath, "utf-8");
  return JSON.parse(contenido) as Viaje[];
}

function getDiaIso(iso: string): string {
  return iso.slice(0, 10);
}

function inferirSentidoPorFecha(viajesData: Viaje[], viajeActual: Viaje): SentidoViaje | null {
  const viajesMismoDia = viajesData
    .filter(
      (viaje) =>
        viaje.id_ruta === viajeActual.id_ruta &&
        viaje.id_bus === viajeActual.id_bus &&
        getDiaIso(viaje.fec_actu) === getDiaIso(viajeActual.fec_actu),
    )
    .sort(
      (a, b) => new Date(a.fec_actu).getTime() - new Date(b.fec_actu).getTime(),
    );

  if (viajesMismoDia.length < 2) return null;

  if (viajesMismoDia[0]?.id === viajeActual.id) return "ida";
  if (viajesMismoDia[viajesMismoDia.length - 1]?.id === viajeActual.id) return "vuelta";

  return null;
}

function mapViajesConSentido(viajesData: Viaje[]): ViajeConSentido[] {
  const sentidoPorParadero = new Map<number, SentidoViaje>(
    (paraderosData as Paradero[]).map((paradero) => [paradero.id, paradero.sentido]),
  );

  return viajesData.map((viaje) => {
    const sentidoParadero = sentidoPorParadero.get(viaje.id_paradero) ?? null;
    const sentido = sentidoParadero ?? inferirSentidoPorFecha(viajesData, viaje);

    return {
      ...viaje,
      sentido,
    };
  });
}

export function getViajes(_req: Request, res: Response): void {
  try {
    const viajesData = readViajesFromJson();
    res.json(mapViajesConSentido(viajesData));
  } catch {
    res.status(500).json({ message: "No se pudo leer viajes.json" });
  }
}

export function getViajeById(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    res.status(400).json({ message: "El id del viaje debe ser numerico" });
    return;
  }

  try {
    const viajesData = readViajesFromJson();
    const viaje = mapViajesConSentido(viajesData).find((item) => item.id === id);

    if (!viaje) {
      res.status(404).json({ message: "Viaje no encontrado" });
      return;
    }

    res.json(viaje);
  } catch {
    res.status(500).json({ message: "No se pudo leer viajes.json" });
  }
}
