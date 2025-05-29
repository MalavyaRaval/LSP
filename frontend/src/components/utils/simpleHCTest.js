// Simple test to verify HC+ string conversion works
import { calculateAggregatedSatisfaction, calculateNormalizedWeights } from './parentCalculation.js';

console.log('=== SIMPLE HC+ STRING CONVERSION TEST ===\n');

// Test data: 20%, 10%, 40%, 50% with equal weights
const satisfactionValues = [0.20, 0.10, 0.40, 0.50];
const importanceValues = [5, 5, 5, 5]; // Equal importance
const weights = calculateNormalizedWeights(importanceValues);

console.log('Test values:', satisfactionValues.map(v => `${(v*100)}%`));
console.log('Weights:', weights);
console.log('');

// Test with string connection "HC+"
console.log('Testing with string connection "HC+":');
const hcPlusResult = calculateAggregatedSatisfaction(satisfactionValues, weights, "HC+");
console.log(`Result: ${(hcPlusResult * 100).toFixed(2)}%\n`);

// Test with string connection "A" (arithmetic mean)
console.log('Testing with string connection "A":');
const arithmeticResult = calculateAggregatedSatisfaction(satisfactionValues, weights, "A");
console.log(`Result: ${(arithmeticResult * 100).toFixed(2)}%\n`);

// Manual arithmetic mean calculation for comparison
const manualArithmeticResult = satisfactionValues.reduce((sum, val, i) => sum + (weights[i] * val), 0);
console.log(`Manual arithmetic mean: ${(manualArithmeticResult * 100).toFixed(2)}%\n`);

// Compare results
if (Math.abs(hcPlusResult - arithmeticResult) < 0.001) {
  console.log('🚨 ISSUE: HC+ and arithmetic mean produce identical results!');
} else {
  console.log('✅ SUCCESS: HC+ produces different result from arithmetic mean!');
  console.log(`Difference: ${((hcPlusResult - arithmeticResult) * 100).toFixed(2)} percentage points`);
}
