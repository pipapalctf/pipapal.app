import { pool, db } from "../server/db";
import { recyclingCenters } from "../shared/schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { parse } from "csv-parse/sync";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    console.log("Starting recycling centers seed script...");
    
    // Parse CSV data
    const csvFilePath = path.resolve(__dirname, '../attached_assets/cleaned_waste_facilities.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found at ${csvFilePath}`);
      return;
    }
    
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} records in CSV file`);
    
    // Delete existing records
    const deleteResult = await db.delete(recyclingCenters);
    console.log(`Deleted existing centers`);
    
    // Insert new records
    for (const record of records) {
      try {
        // Extract latitude and longitude from location data if available
        let latitude: number | undefined = undefined;
        let longitude: number | undefined = undefined;
        
        if (record.latitude && record.longitude) {
          latitude = parseFloat(record.latitude);
          longitude = parseFloat(record.longitude);
        }
        
        // Parse waste types into array
        let wasteTypes = [];
        if (record.wasteTypes) {
          wasteTypes = record.wasteTypes.split(',').map(type => type.trim());
        }
        
        await db.insert(recyclingCenters).values({
          name: record.name || 'Unknown Facility',
          address: record.address || 'Unknown Address',
          city: record.city || 'Nairobi',
          county: record.county || 'Nairobi County',
          location: record.location || record.address || '',
          operator: record.operator || null,
          facilityType: record.facilityType || null,
          wasteTypes: wasteTypes.length > 0 ? wasteTypes : null,
          poBox: record.poBox || null,
          latitude: latitude && !isNaN(latitude) ? latitude : undefined,
          longitude: longitude && !isNaN(longitude) ? longitude : undefined,
          createdAt: new Date()
        });
        
        console.log(`Added center: ${record.name}`);
      } catch (err) {
        console.error(`Error adding recycling center ${record.name}:`, err);
      }
    }
    
    // Verify insertion
    const centers = await db.select().from(recyclingCenters);
    console.log(`Successfully inserted ${centers.length} recycling centers`);
    
    console.log("Seed script completed successfully");
  } catch (error) {
    console.error("Error in seed script:", error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

main();