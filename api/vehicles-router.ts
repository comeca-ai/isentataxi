import { asc } from "drizzle-orm";
import { vehicles } from "@db/schema";
import { getDb } from "./queries/connection";
import { createRouter, publicQuery } from "./middleware";

export const vehiclesRouter = createRouter({
  /** Catálogo ordenado do simulador (público) */
  list: publicQuery.query(() =>
    getDb()
      .select()
      .from(vehicles)
      .orderBy(asc(vehicles.sortOrder), asc(vehicles.priceRef)),
  ),
});
