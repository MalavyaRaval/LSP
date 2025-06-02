/**
 * Test CPA calculation with user's specific values
 */

// Import the CPA functions
const calculateW1 = (P, R) => {
  return (2 * R * (1 - P)) / (P + R);
};

const calculateW2 = (P, R) => {
  return (P - R) / (P - R + 2 * P * R);
};

const cpaFormula = (x, y, P, R) => {
  const W1 = calculateW1(P, R);
  const W2 = calculateW2(P, R);
  
  const numerator = x * (W1 * x + (1 - W1) * y);
  const denominator = W1 * W2 * x + (1 - W1) * W2 * y + (1 - W2) * x;
  
  return numerator / denominator;
};

// Test with user's data
// Medium impact: P=20%, R=10%
const P = 0.2;
const R = 0.1;

console.log("=== CPA Validation Test ===");
console.log(`P (Penalty): ${P}, R (Reward): ${R}`);

// Calculate W1 and W2
const W1 = calculateW1(P, R);
const W2 = calculateW2(P, R);

console.log(`W1: ${W1.toFixed(4)}`);
console.log(`W2: ${W2.toFixed(4)}`);

// Test cases from user's data
const testCases = [
  {
    name: "Alternative 1",
    x: 0.60, // Mandatory (111): 60%
    y: 0.6667, // Optional (112): 66.67%
    expected: 61.04
  },
  {
    name: "Alternative 2", 
    x: 0.84, // Mandatory (111): 84%
    y: 0.50, // Optional (112): 50%
    expected: 78.10
  },
  {
    name: "Alternative 3",
    x: 0.20, // Mandatory (111): 20%
    y: 0.00, // Optional (112): 0%
    expected: 16.01
  }
];

testCases.forEach((testCase) => {
  const result = cpaFormula(testCase.x, testCase.y, P, R);
  const resultPercent = result * 100;
  
  console.log(`\n${testCase.name}:`);
  console.log(`  x (mandatory): ${testCase.x}`);
  console.log(`  y (optional): ${testCase.y}`);
  console.log(`  CPA result: ${resultPercent.toFixed(2)}%`);
  console.log(`  Expected: ${testCase.expected}%`);
  console.log(`  Difference: ${(resultPercent - testCase.expected).toFixed(2)}%`);
});

console.log("\n=== Test Complete ===");
