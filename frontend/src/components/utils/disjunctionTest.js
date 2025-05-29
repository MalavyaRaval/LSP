// Comprehensive test of all connection types including disjunctions
import { calculateAggregatedSatisfaction, calculateNormalizedWeights } from './parentCalculation.js';

try {
  console.log('=== COMPREHENSIVE CONNECTION TYPE TEST (WITH DISJUNCTIONS) ===\n');

  // Test data: 10%, 20%, 40%, 50% with equal weights
  const satisfactionValues = [0.1, 0.2, 0.4, 0.5];
  const importanceValues = [1, 1, 1, 1]; // Equal importance
  const weights = calculateNormalizedWeights(importanceValues);

  console.log('Test values:', satisfactionValues.map(v => `${(v*100)}%`));
  console.log('Weights:', weights);
  console.log('');

  // Test all connection types
  const connectionTypes = [
    'HC++', 'HC+', 'HC', 'HC-', 
    'SC+', 'SC', 'SC-',
    'A',
    'SD+', 'SD', 'SD-',
    'HD++', 'HD+', 'HD', 'HD-'
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

  // Categorize results
  const conjunctions = ['HC++', 'HC+', 'HC', 'HC-', 'SC+', 'SC', 'SC-'];
  const disjunctions = ['SD+', 'SD', 'SD-', 'HD++', 'HD+', 'HD', 'HD-'];

  console.log('\n✅ CONJUNCTION RESULTS (should be ≤ arithmetic mean):');
  conjunctions.forEach(type => {
    const result = results[type];
    const relation = result <= arithmeticMean + 0.001 ? '≤' : '>';
    console.log(`  ${type}: ${(result * 100).toFixed(2)}% ${relation} ${(arithmeticMean * 100).toFixed(2)}%`);
  });

  console.log('\n✅ DISJUNCTION RESULTS (should be ≥ arithmetic mean):');
  disjunctions.forEach(type => {
    const result = results[type];
    const relation = result >= arithmeticMean - 0.001 ? '≥' : '<';
    console.log(`  ${type}: ${(result * 100).toFixed(2)}% ${relation} ${(arithmeticMean * 100).toFixed(2)}%`);
  });

  // Verify mathematical relationships
  console.log('\n=== MATHEMATICAL VERIFICATION ===');

  // Conjunctions should be ≤ arithmetic mean
  const conjunctionsValid = conjunctions.every(type => results[type] <= arithmeticMean + 0.001);
  console.log(conjunctionsValid ? 
    '✅ All conjunctions ≤ arithmetic mean (correct)' : 
    '🚨 Some conjunctions > arithmetic mean (incorrect)'
  );

  // Disjunctions should be ≥ arithmetic mean  
  const disjunctionsValid = disjunctions.every(type => results[type] >= arithmeticMean - 0.001);
  console.log(disjunctionsValid ? 
    '✅ All disjunctions ≥ arithmetic mean (correct)' : 
    '🚨 Some disjunctions < arithmetic mean (incorrect)'
  );

  // HC ordering: HC++ ≤ HC+ ≤ HC ≤ HC-
  const hcOrder = results['HC++'] <= results['HC+'] && 
                  results['HC+'] <= results['HC'] && 
                  results['HC'] <= results['HC-'];
  console.log(hcOrder ? 
    '✅ HC ordering correct: HC++ ≤ HC+ ≤ HC ≤ HC-' : 
    '🚨 HC ordering incorrect'
  );

  // HD ordering: HD++ ≥ HD+ ≥ HD ≥ HD- (opposite of HC due to disjunction)
  const hdOrder = results['HD++'] >= results['HD+'] && 
                  results['HD+'] >= results['HD'] && 
                  results['HD'] >= results['HD-'];
  console.log(hdOrder ? 
    '✅ HD ordering correct: HD++ ≥ HD+ ≥ HD ≥ HD-' : 
    '🚨 HD ordering incorrect'
  );

  // Duality check: SD functions should be dual to SC functions
  console.log('\n=== DUALITY VERIFICATION ===');
  
  // For duality, if we have values [v1, v2, v3, v4], then:
  // SD(v) should equal 1 - SC(1-v) where 1-v = [1-v1, 1-v2, 1-v3, 1-v4]
  const invertedValues = satisfactionValues.map(v => 1 - v);
  
  const scResult = calculateAggregatedSatisfaction(invertedValues, weights, 'SC');
  const sdResult = results['SD'];
  const dualityDiff = Math.abs(sdResult - (1 - scResult));
  
  console.log(`SC on inverted values: ${(scResult * 100).toFixed(2)}%`);
  console.log(`1 - SC on inverted: ${((1 - scResult) * 100).toFixed(2)}%`);
  console.log(`SD on original: ${(sdResult * 100).toFixed(2)}%`);
  console.log(`Duality difference: ${(dualityDiff * 100).toFixed(4)}%`);
  
  if (dualityDiff < 0.0001) {
    console.log('✅ Duality property verified: SD(v) = 1 - SC(1-v)');
  } else {
    console.log('🚨 Duality property failed');
  }

  console.log('\n🎉 DISJUNCTION IMPLEMENTATION COMPLETE!');

} catch (error) {
  console.error('Error occurred:', error);
  console.error(error.stack);
}
