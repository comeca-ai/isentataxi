import { getDb } from "../api/queries/connection";
import { vehicles, type InsertVehicle } from "./schema";

const VEHICLES: Omit<InsertVehicle, "id">[] = [
  { slug: "cronos", name: "Fiat Cronos Drive 1.3", brand: "Fiat", priceRef: 100000, fuel: "flex", ipiRate: "0.110", imageUrl: "/car-cronos.png", sortOrder: 1 },
  { slug: "virtus", name: "VW Virtus 1.0 200 TSI", brand: "Volkswagen", priceRef: 115000, fuel: "flex", ipiRate: "0.110", imageUrl: "/car-virtus.png", sortOrder: 2 },
  { slug: "hb20s", name: "Hyundai HB20S 1.0", brand: "Hyundai", priceRef: 105000, fuel: "flex", ipiRate: "0.110", imageUrl: "/car-hb20s.png", sortOrder: 3 },
  { slug: "onixplus", name: "Chevrolet Onix Plus 1.0", brand: "Chevrolet", priceRef: 102000, fuel: "flex", ipiRate: "0.110", imageUrl: "/car-onixplus.png", sortOrder: 4 },
  { slug: "versa", name: "Nissan Versa Sense 1.6", brand: "Nissan", priceRef: 110000, fuel: "flex", ipiRate: "0.110", imageUrl: "/car-versa.png", sortOrder: 5 },
  { slug: "yaris", name: "Toyota Yaris Sedã XL", brand: "Toyota", priceRef: 120000, fuel: "flex", ipiRate: "0.110", imageUrl: "/car-yaris.png", sortOrder: 6 },
  { slug: "corolla", name: "Toyota Corolla GLi 2.0", brand: "Toyota", priceRef: 160000, fuel: "flex", ipiRate: "0.130", imageUrl: "/car-corolla.png", sortOrder: 7 },
  { slug: "corolla-hybrid", name: "Toyota Corolla Altis Hybrid", brand: "Toyota", priceRef: 190000, fuel: "hibrido", ipiRate: "0.065", imageUrl: "/car-corolla-hybrid.png", sortOrder: 8 },
  { slug: "byd-dolphin", name: "BYD Dolphin Mini", brand: "BYD", priceRef: 120000, fuel: "eletrico", ipiRate: "0.030", imageUrl: "/car-byd-dolphin.png", sortOrder: 9 },
  { slug: "city", name: "Honda City Sedan EXL", brand: "Honda", priceRef: 150000, fuel: "flex", ipiRate: "0.130", imageUrl: "/car-city.png", sortOrder: 10 },
];

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Idempotente: upsert por slug
  for (const vehicle of VEHICLES) {
    await db
      .insert(vehicles)
      .values(vehicle)
      .onDuplicateKeyUpdate({
        set: {
          name: vehicle.name,
          brand: vehicle.brand,
          priceRef: vehicle.priceRef,
          fuel: vehicle.fuel,
          ipiRate: vehicle.ipiRate,
          imageUrl: vehicle.imageUrl,
          sortOrder: vehicle.sortOrder,
        },
      });
  }

  const rows = await db.select().from(vehicles);
  console.log(`Done. ${rows.length} vehicles in catalog.`);
  process.exit(0); // close MySQL connection pool
}

seed();
