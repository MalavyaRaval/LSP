/**
 * Test file for aggregation functions
 * This file demonstrates the different aggregation methods based on connection types
 */

import { calculateAggregatedSatisfaction, calculateNormalizedWeights } from './parentCalculation.js';

// Test case: 3 children with different satisfaction levels
const values = [0.9, 0.8, 0.7]; // 90%, 80%, 70% satisfaction
const importanceValues = [4, 3, 5]; // Different importance levels
const normalizedWeights = calculateNormalizedWeights(importanceValues);

console.log('=== Aggregation Function Test ===');
console.log(`Values: ${values.map(v => `${(v*100).toFixed(1)}%`).join(', ')}`);
console.log(`Importance: ${importanceValues.join(', ')}`);
console.log(`Normalized Weights: ${normalizedWeights.map(w => w.toFixed(3)).join(', ')}`);
console.log('');

// Test different connection types
const connectionTests = [
  { type: 'HC++', value: 8, description: 'Hard Conjunction Plus (Very Strict)' },
  { type: 'HC+', value: 7, description: 'Hard Conjunction Plus' },
  { type: 'HC', value: 6, description: 'Hard Conjunction' },
  { type: 'HC-', value: 5, description: 'Hard Conjunction Minus' },
  { type: 'A', value: 4, description: 'Arithmetic Mean (Default Average)' },
  { type: 'SC+', value: 3, description: 'Soft Conjunction Plus' },
  { type: 'SC', value: 2, description: 'Soft Conjunction' },
  { type: 'SC-', value: 1, description: 'Soft Conjunction Minus' },
  { type: 'Unknown', value: 99, description: 'Unknown Connection (Fallback to Average)' },
];

connectionTests.forEach(test => {
  const result = calculateAggregatedSatisfaction(values, normalizedWeights, test.value);
  console.log(`${test.type.padEnd(4)} (${test.value}): ${(result * 100).toFixed(2)}% - ${test.description}`);
});

console.log('\n=== Connection Type Mapping ===');
console.log('Hard Conjunctions (Stricter):');
console.log('  HC++ (8): Very strict, all children must perform well');
console.log('  HC+ (7):  Strict, similar to HC++');
console.log('  HC (6):   Hard conjunction, penalty for low performers');
console.log('  HC- (5):  Less strict hard conjunction');
console.log('');
console.log('Arithmetic Mean (Simple Average):');
console.log('  A (4):    Simple weighted average (traditional approach)');
console.log('  Unknown:  Any other connection type defaults to arithmetic mean');
console.log('');
console.log('Soft Conjunctions (More Forgiving):');
console.log('  SC+ (3):  Slightly stricter than balanced');
console.log('  SC (2):   Balanced approach');
console.log('  SC- (1):  More forgiving, closer to arithmetic mean');
