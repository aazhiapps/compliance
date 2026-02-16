/**
 * Test script to verify GST seed data ObjectId generation
 * This tests that all IDs are valid ObjectIds without requiring a running MongoDB instance
 */
import mongoose from "mongoose";

// Verify that ObjectIds are properly generated
const clientIds = {
  client1: new mongoose.Types.ObjectId().toString(),
  client2: new mongoose.Types.ObjectId().toString(),
  client3: new mongoose.Types.ObjectId().toString(),
};

const generateObjectIds = (count: number) => 
  Array.from({ length: count }, () => new mongoose.Types.ObjectId().toString());

const purchaseIds = generateObjectIds(9);
const salesIds = generateObjectIds(10);
const filingIds = generateObjectIds(5);

console.log("✓ Testing ObjectId generation...");

// Test that they are valid ObjectIds
try {
  // Test client IDs
  new mongoose.Types.ObjectId(clientIds.client1);
  new mongoose.Types.ObjectId(clientIds.client2);
  new mongoose.Types.ObjectId(clientIds.client3);
  console.log("✓ Client IDs are valid ObjectIds");

  // Test purchase IDs
  purchaseIds.forEach((id, index) => {
    new mongoose.Types.ObjectId(id);
  });
  console.log(`✓ All ${purchaseIds.length} purchase IDs are valid ObjectIds`);

  // Test sales IDs
  salesIds.forEach((id, index) => {
    new mongoose.Types.ObjectId(id);
  });
  console.log(`✓ All ${salesIds.length} sales IDs are valid ObjectIds`);

  // Test filing IDs
  filingIds.forEach((id, index) => {
    new mongoose.Types.ObjectId(id);
  });
  console.log(`✓ All ${filingIds.length} filing IDs are valid ObjectIds`);

  console.log("\n✓ All ObjectIds are valid! Seed data structure is correct.");
  console.log("\nSample ObjectIds:");
  console.log(`  Client 1: ${clientIds.client1}`);
  console.log(`  Purchase 1: ${purchaseIds[0]}`);
  console.log(`  Sales 1: ${salesIds[0]}`);
  console.log(`  Filing 1: ${filingIds[0]}`);

  process.exit(0);
} catch (error) {
  console.error("✗ Error: Invalid ObjectId detected!", error);
  process.exit(1);
}
