/**
 * Quick test to verify HC function manually
 */

const values = [0.20, 0.10, 0.40, 0.50];
const weights = [0.25, 0.25, 0.25, 0.25];

// Arithmetic mean
const arithmetic = values.reduce((sum, val, i) => sum + (weights[i] * val), 0);
console.log(`Arithmetic Mean: ${(arithmetic * 100).toFixed(2)}%`);

// HC calculation
const R_HC = [-2.813, -2.539, -2.327, -2.165];
const r = R_HC[2]; // For 4 children
console.log(`Using r=${r} for 4 children`);

const weightedSum = values.reduce((sum, val, i) => {
  const term = weights[i] * Math.pow(val, r);
  console.log(`Term ${i}: ${weights[i]} * ${val}^${r} = ${weights[i]} * ${Math.pow(val, r)} = ${term}`);
  return sum + term;
}, 0);

console.log(`Weighted sum: ${weightedSum}`);
const hcResult = Math.pow(weightedSum, 1/r);
console.log(`HC Result: ${weightedSum}^(1/${r}) = ${(hcResult * 100).toFixed(2)}%`);

console.log(`\nDifference from arithmetic: ${((hcResult - arithmetic) * 100).toFixed(2)}%`);
