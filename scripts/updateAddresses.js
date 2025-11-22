// Script to update all user addresses from string to object format with coordinates
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user.model.js';

// Load environment variables
dotenv.config();

// Sample coordinates for Tunisia (you can customize these)
const tunisiaCoordinates = {
  'Tunis': { lat: 36.8065, lng: 10.1815 },
  'Ariana': { lat: 36.8625, lng: 10.1956 },
  'Ben Arous': { lat: 36.7464, lng: 10.2192 },
  'Manouba': { lat: 36.8081, lng: 10.0965 },
  'Bizerte': { lat: 37.2746, lng: 9.8739 },
  'Nabeul': { lat: 36.4561, lng: 10.7376 },
  'Sousse': { lat: 35.8256, lng: 10.6369 },
  'Monastir': { lat: 35.7775, lng: 10.8263 },
  'Sfax': { lat: 34.7406, lng: 10.7603 },
  'Kairouan': { lat: 35.6781, lng: 10.0963 },
  'Kasserine': { lat: 35.1675, lng: 8.8361 },
  'Sidi Bouzid': { lat: 35.0381, lng: 9.4839 },
  'Gabès': { lat: 33.8815, lng: 10.0982 },
  'Médenine': { lat: 33.3545, lng: 10.5055 },
  'Tataouine': { lat: 32.9296, lng: 10.4517 },
  'Gafsa': { lat: 34.4250, lng: 8.7842 },
  'Tozeur': { lat: 33.9197, lng: 8.1338 },
  'Kébili': { lat: 33.7047, lng: 8.9692 },
  'Jendouba': { lat: 36.5011, lng: 8.7803 },
  'Kef': { lat: 36.1742, lng: 8.7050 },
  'Siliana': { lat: 36.0853, lng: 9.3700 },
  'Beja': { lat: 36.7256, lng: 9.1817 },
  'Zaghouan': { lat: 36.4028, lng: 10.1433 },
  'Mahdia': { lat: 35.5047, lng: 11.0622 }
};

// Default Tunisia center
const defaultCoords = { lat: 36.8065, lng: 10.1815 };

async function updateAddresses() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment variables');
    }
    
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all users with string addresses
    const users = await User.find({});
    console.log(`\n📊 Found ${users.length} users to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if address is already an object
      if (typeof user.adresse === 'object' && user.adresse.lat && user.adresse.lng) {
        console.log(`⏭️  Skipping ${user.email} - already has coordinates`);
        skippedCount++;
        continue;
      }

      // Get the old address string
      const oldAddress = typeof user.adresse === 'string' ? user.adresse : 'Non spécifiée';
      
      // Try to find matching coordinates based on city name
      let coords = defaultCoords;
      for (const [city, cityCoords] of Object.entries(tunisiaCoordinates)) {
        if (oldAddress.toLowerCase().includes(city.toLowerCase())) {
          coords = cityCoords;
          break;
        }
      }

      // Update the address
      user.adresse = {
        street: oldAddress,
        lat: coords.lat,
        lng: coords.lng
      };

      await user.save();
      console.log(`✅ Updated ${user.email}: "${oldAddress}" → { street: "${oldAddress}", lat: ${coords.lat}, lng: ${coords.lng} }`);
      updatedCount++;
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   ✅ Updated: ${updatedCount} users`);
    console.log(`   ⏭️  Skipped: ${skippedCount} users (already had coordinates)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
updateAddresses();
