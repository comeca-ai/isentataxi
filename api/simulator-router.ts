import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  FUEL_TYPES,
  ICMS_RATE,
  IPI_RATES,
  IPVA_FIRST_YEAR_NOTE,
  IPVA_RATE,
  TETO_PRECO,
  type FuelType,
} from "@contracts/constants";
import { leads, vehicles } from "@db/schema";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

const fuelEnum = z.enum(["flex", "hibrido", "eletrico"]);

function brl(value: number): number {
  return Math.round(value * 100) / 100;
}

export const simulatorRouter = createRouter({
  /** Calcula economia estimada de IPI + ICMS (público) */
  calculate: publicQuery
    .input(
      z.object({
        vehicleId: z.number().int().positive().optional(),
        customPrice: z.number().positive().optional(),
        fuel: fuelEnum.optional(),
      }),
    )
    .query(async ({ input }) => {
      let price: number;
      let ipiRate: number;
      let fuel: FuelType;

      if (input.vehicleId != null) {
        const [vehicle] = await getDb()
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, input.vehicleId))
          .limit(1);
        if (!vehicle) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Veículo não encontrado no catálogo.",
          });
        }
        price = vehicle.priceRef;
        ipiRate = Number(vehicle.ipiRate);
        fuel = vehicle.fuel;
      } else {
        if (input.customPrice == null || input.fuel == null) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Informe um veículo do catálogo ou um preço + combustível.",
          });
        }
        price = input.customPrice;
        fuel = input.fuel;
        ipiRate = IPI_RATES[fuel];
      }

      if (price > TETO_PRECO) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A isenção vale para carros de até R$ ${TETO_PRECO.toLocaleString("pt-BR")}. Este valor passa do teto — fale com a gente no WhatsApp para avaliar seu caso.`,
        });
      }

      const ipiValue = brl(price * ipiRate);
      const icmsValue = brl(price * ICMS_RATE);
      const totalSavings = brl(ipiValue + icmsValue);

      return {
        price,
        fuel,
        fuelLabel: FUEL_TYPES[fuel],
        ipiRate,
        ipiValue,
        icmsValue,
        totalSavings,
        finalPrice: brl(price - totalSavings),
        ipvaAnnual: Math.round(price * IPVA_RATE),
        ipvaNote: IPVA_FIRST_YEAR_NOTE,
      };
    }),

  /** Salva lead capturado no simulador (isca grátis) */
  saveLead: publicQuery
    .input(
      z.object({
        name: z.string().min(2, "Informe seu nome"),
        whatsapp: z.string().min(8, "Informe um WhatsApp válido"),
        email: z.string().email("E-mail inválido").optional(),
        simulationSnapshot: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [{ id }] = await db
        .insert(leads)
        .values({
          name: input.name,
          whatsapp: input.whatsapp,
          email: input.email ?? null,
          source: "simulador",
          simulationSnapshot: input.simulationSnapshot ?? null,
        })
        .$returningId();
      return { id };
    }),
});
