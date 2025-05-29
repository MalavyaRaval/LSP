/**
 * Debug script to check connection values and their mapping
 */

// Import the connection conversion function if available
const getAggregationFunction = (connectionValue) => {
  const connectionMap = {
    8: 'hcp',   // HC++
    7: 'hcp',   // HC+ (using HCP)
    6: 'hc',    // HC
    5: 'hcm',   // HC-
    3: 'scp',   // SC+
    2: 'sc',    // SC
    1: 'scm',   // SC-
    // Negative values for disjunctions
    "-1": 'scm', // SD-
    "-2": 'sc',  // SD
    "-3": 'scp', // SD+
    "-5": 'hcm', // HD-
    "-6": 'hc',  // HD
    "-7": 'hcp', // HD+
    "-8": 'hcp', // HD++
  };

  console.log(`Connection Value: ${connectionValue} (type: ${typeof connectionValue})`);
  console.log(`String version: "${connectionValue?.toString()}"`);
  console.log(`Found in map: ${!!connectionMap[connectionValue?.toString()]}`);
  
  if (connectionMap[connectionValue?.toString()]) {
    console.log(`Mapped to: ${connectionMap[connectionValue?.toString()]}`);
    return connectionMap[connectionValue?.toString()];
  }
  
  console.log(`Fallback to: arithmeticMean`);
  return 'arithmeticMean';
};

console.log('=== CONNECTION MAPPING DEBUG ===');
console.log('');

// Test various connection values
const testValues = [
  8,    // HC++ - should map to hcp
  "8",  // HC++ as string - should map to hcp
  7,    // HC+ - should map to hcp
  4,    // A - should fallback to arithmetic mean
  "4",  // A as string - should fallback to arithmetic mean
  2,    // SC - should map to sc
  null, // null - should fallback to arithmetic mean
  undefined, // undefined - should fallback to arithmetic mean
];

testValues.forEach(value => {
  console.log(`--- Testing connection value: ${value} ---`);
  getAggregationFunction(value);
  console.log('');
});
