/**
 * Debug test for HCP vs Arithmetic Mean
 * This will help us verify that the formulas are working correctly
 */

// Simulate the functions from parentCalculation.js
const R_HCP = [-7.675, -6.53, -5.75, -5.19];

const getRValue = (n, table) => {
  const index = Math.min(n, 5) - 2;
  return table[index];
};

const powerMean = (values, weights, r) => {
  console.log(`Power Mean Debug: values=${values}, weights=${weights}, r=${r}`);
  const weightedSum = values.reduce((sum, value, index) => {
    const term = weights[index] * Math.pow(value, r);
    console.log(`  Term ${index}: weight=${weights[index]}, value=${value}, value^r=${Math.pow(value, r)}, term=${term}`);
    return sum + term;
  }, 0);
  console.log(`  Weighted sum: ${weightedSum}`);
  const result = Math.pow(weightedSum, 1 / r);
  console.log(`  Final result: ${weightedSum}^(1/${r}) = ${result}`);
  return result;
};

const arithmeticMean = (values, weights) => {
  console.log(`Arithmetic Mean Debug: values=${values}, weights=${weights}`);
  const result = values.reduce((sum, value, index) => {
    return sum + (weights[index] * value);
  }, 0);
  console.log(`  Result: ${result}`);
  return result;
};

const hcp = (values, weights) => {
  const r = getRValue(values.length, R_HCP);
  console.log(`HCP: Using r=${r} for ${values.length} children`);
  return powerMean(values, weights, r);
};

// Test case: values that should show clear difference
const testValues = [0.9, 0.6]; // 90% and 60% satisfaction
const testWeights = [0.5, 0.5]; // Equal weights

console.log('=== TEST: HCP vs Arithmetic Mean ===');
console.log(`Test values: ${testValues.map(v => `${(v*100).toFixed(1)}%`).join(', ')}`);
console.log(`Test weights: ${testWeights.join(', ')}`);
console.log('');

console.log('--- HCP Calculation ---');
const hcpResult = hcp(testValues, testWeights);
console.log(`HCP Result: ${(hcpResult * 100).toFixed(2)}%`);
console.log('');

console.log('--- Arithmetic Mean Calculation ---');
const arithmeticResult = arithmeticMean(testValues, testWeights);
console.log(`Arithmetic Result: ${(arithmeticResult * 100).toFixed(2)}%`);
console.log('');

console.log('--- Comparison ---');
console.log(`Difference: ${((hcpResult - arithmeticResult) * 100).toFixed(2)}%`);
if (Math.abs(hcpResult - arithmeticResult) < 0.001) {
  console.log('⚠️  WARNING: Results are nearly identical! There might be an issue.');
} else {
  console.log('✅ Results are different as expected.');
}
