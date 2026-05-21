/**
 * Test file for distance calculator utility
 * Tests the Haversine formula and distance formatting functions
 */

import { 
  calculateDistance, 
  formatDistance, 
  getDistanceColor, 
  getDistanceLabel 
} from './distanceCalculator';

// Test cases
const testCases = [
  // Same location (0 km)
  { lat1: 35.8256, lon1: 10.6369, lat2: 35.8256, lon2: 10.6369, expected: "0" },
  
  // Short distance (should be < 1 km, formatted as meters)
  { lat1: 35.8256, lon1: 10.6369, lat2: 35.8260, lon2: 10.6369, expected: "<1000" }, 
  
  // Medium distance (should be in km)
  { lat1: 35.8256, lon1: 10.6369, lat2: 35.8256, lon2: 10.7369, expected: ">0" },
];

// Run tests
console.log("=== Distance Calculator Tests ===\n");

testCases.forEach((testCase, index) => {
  const distance = calculateDistance(
    testCase.lat1, 
    testCase.lon1, 
    testCase.lat2, 
    testCase.lon2
  );
  
  console.log(`Test ${index + 1}:`);
  console.log(`  From: (${testCase.lat1}, ${testCase.lon1})`);
  console.log(`  To: (${testCase.lat2}, ${testCase.lon2})`);
  console.log(`  Distance: ${distance} km`);
  console.log(`  Formatted: ${formatDistance(distance)}`);
  console.log(`  Label: ${getDistanceLabel(distance)}`);
  console.log(`  Color: ${getDistanceColor(distance)}`);
  console.log();
});

// Test color classification
console.log("=== Color Classification Tests ===\n");
const distances = [2, 10, 20, 35];
distances.forEach(dist => {
  console.log(`${dist}km - Label: "${getDistanceLabel(dist)}", Color: ${getDistanceColor(dist).split(' ')[0]}`);
});

console.log("\n=== All tests completed ===");


