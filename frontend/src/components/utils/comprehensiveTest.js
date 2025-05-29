// Comprehensive test of all connection types
import { calculateAggregatedSatisfaction, calculateNormalizedWeights } from './parentCalculation.js';

try {
  console.log('=== COMPREHENSIVE CONNECTION TYPE TEST ===\n');

  // Test data: 20%, 10%, 40%, 50% with equal weights
  const satisfactionValues = [0.20, 0.10, 0.40, 0.50];
  const importanceValues = [5, 5, 5, 5]; // Equal importance
  const weights = calculateNormalizedWeights(importanceValues);

  console.log('Test values:', satisfactionValues.map(v => `${(v*100)}%`));
  console.log('Weights:', weights);
  console.log('');

  // Test all connection types
  const connectionTypes = [
    'HC++', 'HC+', 'HC', 'HC-', 
    'SC+', 'SC', 'SC-',
    'A'
  ];

  const results = {};

  connectionTypes.forEach(connectionType => {
    const result = calculateAggregatedSatisfaction(satisfactionValues, weights, connectionType);
    results[connectionType] = result;
    console.log(`${connectionType.padEnd(4)}: ${(result * 100).toFixed(2)}%`);
  });

  console.log('\n=== ANALYSIS ===');

  // Arithmetic mean for comparison
  const arithmeticMean = results['A'];
  console.log(`Arithmetic Mean (A): ${(arithmeticMean * 100).toFixed(2)}%`);

  // Check which functions produce different results
  const differentFromArithmetic = [];

  Object.keys(results).forEach(type => {
    if (type !== 'A') {
      if (Math.abs(results[type] - arithmeticMean) > 0.001) {
        differentFromArithmetic.push(`${type}: ${(results[type] * 100).toFixed(2)}%`);
      }
    }
  });

  if (differentFromArithmetic.length > 0) {
    console.log('\n✅ Connection types producing different results from arithmetic mean:');
    differentFromArithmetic.forEach(result => console.log(`  ${result}`));
    console.log('\n🎉 SUCCESS: HC+ aggregation is now working correctly!');
  } else {
    console.log('\n🚨 All connection types still producing arithmetic mean results');
  }

} catch (error) {
  console.error('Error occurred:', error);
}
