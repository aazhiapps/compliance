import { serviceRepository } from "../repositories/serviceRepository";
import { reportRepository } from "../repositories/reportRepository";
import { initialServices } from "./seeds/serviceSeeds";
import { demoReports } from "./seeds/reportSeeds";
import { seedGSTData } from "./gstSeedData";

/**
 * Seed demo services
 */
export const seedServices = async () => {
  console.log("Seeding services...");
  for (const service of initialServices) {
    await serviceRepository.create(service);
  }
  console.log(`✓ Seeded ${initialServices.length} demo services`);
};

/**
 * Seed demo reports
 */
export const seedReports = async () => {
  console.log("Seeding reports...");
  for (const report of demoReports) {
    await reportRepository.create(report);
  }
  console.log(`✓ Seeded ${demoReports.length} demo reports`);
};

/**
 * Master function to seed all demo data
 */
export const seedAllData = async () => {
  console.log("Starting data seeding...");
  try {
    await seedServices();
    await seedReports();
    await seedGSTData();
    console.log("✓ All demo data seeded successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
};
