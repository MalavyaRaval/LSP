/**
 * Debug test using your actual data
 * Node 1 (HCP) with children: a(20%), b(10%), c(40%), d(50%) all with importance 5
 */

// Import the actual functions
import { calculateAlternativeSatisfactions } from './parentCalculation.js';

// Your actual tree structure
const testTreeData = {
  id: "root",
  name: "Cost",
  children: [
    {
      id: "1",      name: "hcp",
      attributes: {
        connection: "HC+" // HC+ connection type (string as stored in database)
      },
      children: [
        {
          id: "11",
          name: "a",
          attributes: {
            importance: 5
          },
          children: []
        },
        {
          id: "12", 
          name: "b",
          attributes: {
            importance: 5
          },
          children: []
        },
        {
          id: "13",
          name: "c", 
          attributes: {
            importance: 5
          },
          children: []
        },
        {
          id: "14",
          name: "d",
          attributes: {
            importance: 5
          },
          children: []
        }
      ]
    }
  ]
};

// Your actual satisfaction data
const testSatisfactionData = {
  "11": { alt1: 20 }, // 20%
  "12": { alt1: 10 }, // 10% 
  "13": { alt1: 40 }, // 40%
  "14": { alt1: 50 }  // 50%
};

console.log('=== REAL DATA DEBUG TEST ===');
console.log('Tree structure:');
console.log('Node 1 (hcp) - connection: 6 (HC+)');
console.log('  ├─ Node 11 (a) - importance: 5, satisfaction: 20%');
console.log('  ├─ Node 12 (b) - importance: 5, satisfaction: 10%');
console.log('  ├─ Node 13 (c) - importance: 5, satisfaction: 40%');
console.log('  └─ Node 14 (d) - importance: 5, satisfaction: 50%');
console.log('');

// Test the calculation
const result = calculateAlternativeSatisfactions(testTreeData, testSatisfactionData);
console.log('Calculated satisfactions:');
console.log(JSON.stringify(result, null, 2));

// Expected calculations:
console.log('\n=== MANUAL VERIFICATION ===');

// Equal weights since all importance = 5
const weights = [0.25, 0.25, 0.25, 0.25];
const values = [0.20, 0.10, 0.40, 0.50];

// Arithmetic mean calculation
const arithmeticResult = values.reduce((sum, val, i) => sum + (weights[i] * val), 0);
console.log(`Arithmetic Mean: ${(arithmeticResult * 100).toFixed(2)}%`);

// HC+ calculation (should use R_HC table with index for 4 children)
const R_HC = [-5.75, -4.5, -3.73, -3.2];
const r = R_HC[2]; // index 2 for 4 children (4-2=2)
console.log(`HC+ using r=${r}`);

const weightedSum = values.reduce((sum, val, i) => sum + (weights[i] * Math.pow(val, r)), 0);
const hcResult = Math.pow(weightedSum, 1/r);
console.log(`HC+ Result: ${(hcResult * 100).toFixed(2)}%`);

if (result && result.alt1 && result.alt1['1']) {
  const calculatedValue = result.alt1['1'];
  console.log(`\nActual calculated result: ${(calculatedValue * 100).toFixed(2)}%`);
  
  if (Math.abs(calculatedValue - arithmeticResult) < 0.001) {
    console.log('🚨 ISSUE: Using arithmetic mean instead of HC+!');
  } else if (Math.abs(calculatedValue - hcResult) < 0.001) {
    console.log('✅ SUCCESS: Using HC+ formula correctly!');
  } else {
    console.log('❓ UNKNOWN: Result doesn\'t match either formula');
  }
}
