import { db } from "../server/db";
import { recyclingCenters } from "../shared/schema";

async function addMoreRecyclingCenters() {
  console.log("Adding more recycling centers to the database...");

  // Additional recycling centers data
  const additionalCenters = [
    {
      name: "Kisumu Green Recyclers",
      operator: "Kisumu County",
      location: "Kisumu CBD",
      facilityType: "Recycling Facility",
      wasteTypes: ["plastic", "paper", "glass", "metal"],
      address: "Jomo Kenyatta Highway",
      city: "Kisumu",
      county: "Kisumu County",
      poBox: "P.O Box 11223",
      latitude: -0.1022,
      longitude: 34.7617
    },
    {
      name: "Eldoret Waste Solutions",
      operator: "Eldoret Waste Management",
      location: "Industrial Area Eldoret",
      facilityType: "Waste Processing",
      wasteTypes: ["organic", "plastic", "general"],
      address: "Uganda Road",
      city: "Eldoret", 
      county: "Uasin Gishu County",
      poBox: "P.O Box 66778",
      latitude: 0.5143,
      longitude: 35.2698
    },
    {
      name: "Mombasa Recyclers",
      operator: "Mombasa County Government",
      location: "Mombasa Island",
      facilityType: "Recycling Facility",
      wasteTypes: ["plastic", "metal", "electronic"],
      address: "Moi Avenue",
      city: "Mombasa",
      county: "Mombasa County",
      poBox: "P.O Box 33221",
      latitude: -4.0435,
      longitude: 39.6682
    },
    {
      name: "Thika E-Waste Recyclers",
      operator: "E-Waste Solutions Ltd",
      location: "Thika Town",
      facilityType: "Electronic Recycling",
      wasteTypes: ["electronic", "hazardous"],
      address: "Kenyatta Highway",
      city: "Thika",
      county: "Kiambu County",
      poBox: "P.O Box 44556",
      latitude: -1.0396,
      longitude: 37.0834
    },
    {
      name: "Machakos Green Solutions",
      operator: "Machakos Environmental Group",
      location: "Machakos Town",
      facilityType: "Waste Management",
      wasteTypes: ["general", "organic", "plastic"],
      address: "Machakos-Kitui Road",
      city: "Machakos",
      county: "Machakos County",
      poBox: "P.O Box 00112",
      latitude: -1.5176,
      longitude: 37.2634
    },
    {
      name: "Naivasha Metal Recyclers",
      operator: "Lake Basin Recycling Co.",
      location: "Naivasha Town",
      facilityType: "Metal Recycling",
      wasteTypes: ["metal", "electronic"],
      address: "Moi South Lake Road",
      city: "Naivasha",
      county: "Nakuru County",
      poBox: "P.O Box 88990",
      latitude: -0.7172,
      longitude: 36.4393
    },
    {
      name: "Kitui Plastic Recyclers",
      operator: "Kitui Environmental Conservation",
      location: "Kitui Township",
      facilityType: "Plastic Recycling",
      wasteTypes: ["plastic", "general"],
      address: "Kitui-Machakos Road",
      city: "Kitui",
      county: "Kitui County",
      poBox: "P.O Box 99001",
      latitude: -1.3683,
      longitude: 38.0133
    },
    {
      name: "Malindi Waste Management",
      operator: "Coastal Recycling Initiative",
      location: "Malindi Town",
      facilityType: "Waste Management",
      wasteTypes: ["general", "organic", "plastic", "paper"],
      address: "Malindi-Mombasa Highway",
      city: "Malindi",
      county: "Kilifi County",
      poBox: "P.O Box 33445",
      latitude: -3.2138,
      longitude: 40.1169
    },
    {
      name: "Kakamega Paper Recyclers",
      operator: "Western Kenya Recycling",
      location: "Kakamega CBD",
      facilityType: "Paper Recycling",
      wasteTypes: ["paper", "cardboard"],
      address: "Kakamega-Kisumu Road",
      city: "Kakamega",
      county: "Kakamega County",
      poBox: "P.O Box 55667",
      latitude: 0.2827,
      longitude: 34.7519
    },
    {
      name: "Nyeri Compost Center",
      operator: "Central Kenya Organic Farms",
      location: "Nyeri Town",
      facilityType: "Organic Waste Processing",
      wasteTypes: ["organic", "general"],
      address: "Nyeri-Karatina Road",
      city: "Nyeri",
      county: "Nyeri County",
      poBox: "P.O Box 77889",
      latitude: -0.4246,
      longitude: 36.9428
    }
  ];

  try {
    // Insert the additional recycling centers into the database
    const result = await db.insert(recyclingCenters).values(additionalCenters);
    
    console.log(`Successfully added ${additionalCenters.length} more recycling centers!`);
    console.log("New recycling centers:", additionalCenters.map(c => c.name).join(", "));
    
    return { success: true, count: additionalCenters.length };
  } catch (error) {
    console.error("Error adding more recycling centers:", error);
    return { success: false, error };
  } finally {
    process.exit();
  }
}

// Run the function
addMoreRecyclingCenters();