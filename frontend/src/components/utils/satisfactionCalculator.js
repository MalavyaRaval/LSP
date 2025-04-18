// Mapping of qualitative satisfaction to numeric value
export const satisfactionScoreMap = {
  "Lowest": 0.0,
  "Very low": 0.17,   // roughly 1/6
  "Low": 0.33,        // 2/6
  "Medium": 0.5,      // or "Average"
  "High": 0.67,       // 4/6
  "Very high": 0.83,  // 5/6
  "Highest": 1.0
};

// Convert qualitative label to numeric score (default to 0 if not found)
export function qualitativeToNumeric(label) {
  return satisfactionScoreMap[label] ?? 0;
}

// Example domain extremes for normalization (could be attribute-specific or globally defined)
const DEFAULT_DOMAIN_MIN = 0;   // worst-case minimum for increasing (or best-case for decreasing)
const DEFAULT_DOMAIN_MAX = 100; // best-case maximum for increasing (or worst-case for decreasing)

// Scoring for "increasing values preferred" (Q4)
export function scoreIncreasing(value, minVal = DEFAULT_DOMAIN_MIN, maxVal = DEFAULT_DOMAIN_MAX) {
  // Convert value to number if it's a string
  value = Number(value);
  minVal = Number(minVal);
  maxVal = Number(maxVal);

  if (isNaN(value)) return 0; // If value is not a valid number, return 0 satisfaction
  if (value <= minVal) return 0;
  if (value >= maxVal) return 1;
  // Linear interpolation between min (0) and max (1)
  return (value - minVal) / (maxVal - minVal);
}

// Scoring for "decreasing values preferred" (Q5)
export function scoreDecreasing(value, minVal = DEFAULT_DOMAIN_MIN, maxVal = DEFAULT_DOMAIN_MAX) {
  // Convert value to number if it's a string
  value = Number(value);
  minVal = Number(minVal);
  maxVal = Number(maxVal);
  
  if (isNaN(value)) return 0; // If value is not a valid number, return 0 satisfaction
  if (value <= minVal) return 1;  // at or below minimum (best case for decreasing) → 100% satisfaction
  if (value >= maxVal) return 0;  // at or above maximum (worst case for decreasing) → 0% satisfaction
  // Invert the scale: higher value yields lower score
  return (maxVal - value) / (maxVal - minVal);
}

// Scoring for "specific range preferred" (Q6/Q7)
export function scoreInRange(value, idealMin, idealMax, outsideMin = DEFAULT_DOMAIN_MIN, outsideMax = DEFAULT_DOMAIN_MAX) {
  // Convert all values to numbers
  value = Number(value);
  idealMin = Number(idealMin);
  idealMax = Number(idealMax);
  outsideMin = Number(outsideMin);
  outsideMax = Number(outsideMax);
  
  if (isNaN(value)) return 0; // If value is not a valid number, return 0 satisfaction
  
  if (idealMin > idealMax) {
    // Swap if inputs are inverted (just in case)
    [idealMin, idealMax] = [idealMax, idealMin];
  }
  if (value >= idealMin && value <= idealMax) {
    // Within the ideal range → maximum satisfaction
    return 1;
  } else if (value < idealMin) {
    // Below ideal range: interpolate from 0 at outsideMin up to 1 at idealMin
    if (value <= outsideMin) return 0;
    return (value - outsideMin) / (idealMin - outsideMin);
  } else { // value > idealMax
    // Above ideal range: interpolate from 1 at idealMax down to 0 at outsideMax
    if (value >= outsideMax) return 0;
    return (outsideMax - value) / (outsideMax - idealMax);
  }
}

// Compute normalized weights from importance values
export function normalizeWeights(importances) {
  const total = importances.reduce((sum, imp) => sum + imp, 0);
  return importances.map(imp => (imp / total));
}

// Hard Conjunction (HC) aggregator
export function hardConjunction(values, weights, variant = "base") {
  const n = values.length;
  // Exponent values from reference (for n=2..5):
  const expMapBase = {2: -1.188, 3: -1.151, 4: -1.101, 5: -1.058};   // moderate hard conjunction
  const expMapPlus = {2: -2.813, 3: -2.539, 4: -2.327, 5: -2.165};   // stricter hard conjunction
  const r = (variant === "plus" ? expMapPlus[n] : expMapBase[n]) ?? -1.0;  // default to -1.0 if n out of range
  // Calculate weighted power mean: (Σ W_i * x_i^r)^(1/r)
  let sumPower = 0;
  for (let i = 0; i < n; i++) {
    sumPower += weights[i] * Math.pow(values[i], r);
  }
  const result = Math.pow(sumPower, 1 / r);
  return result;
}

// Soft Conjunction (SC) aggregator
export function softConjunction(values, weights, variant = "base") {
  const n = values.length;
  // Exponent R(n) for soft conjunction (for n=2..5):
  const R = {2: -0.721, 3: -0.737, 4: -0.727, 5: -0.712};
  const r = R[n] ?? -0.72;  // use ~-0.72 as fallback for larger n
  // Compute weighted sum and weighted power mean of inputs
  let weightedSum = 0;
  let sumPower = 0;
  for (let i = 0; i < n; i++) {
    weightedSum += weights[i] * values[i];
    sumPower    += weights[i] * Math.pow(values[i], r);
  }
  const powerMean = Math.pow(sumPower, 1 / r);
  // Mix the arithmetic mean and power mean according to variant
  let a, b;
  if (variant === "plus") {
    a = 1/7; b = 6/7;
  } else { // base SC
    a = 3/7; b = 4/7;
  }
  return a * weightedSum + b * powerMean;
}

// Average (A) aggregator – weighted arithmetic mean
export function averageAgg(values, weights) {
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += weights[i] * values[i];
  }
  return sum;  // already weighted sum (weights sum to 1)
}

// Soft Disjunction (SD) aggregator
export function softDisjunction(values, weights) {
  // Compute soft conjunction on the complements of the inputs
  const compVals = values.map(v => 1 - v);
  const compConj = softConjunction(compVals, weights);  // use base SC for SD
  return 1 - compConj;
}

// Hard Disjunction (HD) aggregator
export function hardDisjunction(values, weights) {
  const compVals = values.map(v => 1 - v);
  const compConj = hardConjunction(compVals, weights, "base");  // use base HC for HD
  return 1 - compConj;
}

// Helper function to evaluate a node's satisfaction
export function evaluateNode(node, debug = false) {
  if (node.isLeaf) {
    // Leaf: compute satisfaction from raw value and preference type
    const rawValue = Number(node.value);               // the actual value of the attribute
    const prefType = node.preferenceType || "increasing"; // default to increasing if not specified
    const qualitativeInput = node.qualLevel;   // e.g., "High", "Medium", etc., if given
    
    if (debug) {
      console.log(`Leaf node ${node.id || node.name}: value=${rawValue}, prefType=${prefType}`);
    }
    
    let satisfaction;
    if (qualitativeInput) {
      // If user provided a qualitative satisfaction directly
      satisfaction = qualitativeToNumeric(qualitativeInput);
    } else if (isNaN(rawValue)) {
      // If raw value is not a valid number
      satisfaction = 0;
    } else {
      // Compute satisfaction based on preference type
      switch (prefType) {
        case "increasing":
          satisfaction = scoreIncreasing(rawValue, node.minAcceptable || DEFAULT_DOMAIN_MIN, node.maxAcceptable || DEFAULT_DOMAIN_MAX);
          break;
        case "decreasing":
          satisfaction = scoreDecreasing(rawValue, node.minAcceptable || DEFAULT_DOMAIN_MIN, node.maxAcceptable || DEFAULT_DOMAIN_MAX);
          break;
        case "range":
          // Use provided ideal range from node (for Q7) or a default (for Q6)
          satisfaction = scoreInRange(rawValue, node.idealMin || DEFAULT_DOMAIN_MIN, 
                                     node.idealMax || DEFAULT_DOMAIN_MAX, 
                                     node.minAcceptable || DEFAULT_DOMAIN_MIN, 
                                     node.maxAcceptable || DEFAULT_DOMAIN_MAX);
          break;
        default:
          satisfaction = scoreIncreasing(rawValue); // fallback for undefined type
      }
    }
    
    if (debug) {
      console.log(`Satisfaction calculated: ${satisfaction}`);
    }
    
    return satisfaction;
  } else {
    // Internal node: evaluate all children first
    if (debug) {
      console.log(`Internal node ${node.id || node.name}: evaluating children`);
    }
    
    const childSatisfactions = node.children.map(child => evaluateNode(child, debug));
    const weights = normalizeWeights(node.children.map(child => child.importance || 1)); // Default to equal importance if not specified
    
    // Log child satisfactions and weights for debugging
    if (debug) {
      console.log(`Child satisfactions for node ${node.id || node.name}:`, childSatisfactions);
      console.log(`Child weights for node ${node.id || node.name}:`, weights);
      console.log(`Connector type: ${node.connector || 'A (default)'}`);
    }
    
    // Apply the logic connector specified for this node
    let aggResult;
    switch (node.connector) {
      case "HC":   // Hard Conjunction
        aggResult = hardConjunction(childSatisfactions, weights, "base");
        break;
      case "HC+":  // Hard Conjunction Plus
        aggResult = hardConjunction(childSatisfactions, weights, "plus");
        break;
      case "SC":   // Soft Conjunction
        aggResult = softConjunction(childSatisfactions, weights, "base");
        break;
      case "SC+":  // Soft Conjunction Plus
        aggResult = softConjunction(childSatisfactions, weights, "plus");
        break;
      case "A":    // Average
        aggResult = averageAgg(childSatisfactions, weights);
        break;
      case "SD":   // Soft Disjunction
        aggResult = softDisjunction(childSatisfactions, weights);
        break;
      case "HD":   // Hard Disjunction
        aggResult = hardDisjunction(childSatisfactions, weights);
        break;
      default:
        aggResult = averageAgg(childSatisfactions, weights); // default to average if unspecified
    }
    
    if (debug) {
      console.log(`Aggregated result for node ${node.id || node.name}: ${aggResult}`);
    }
    
    return aggResult;
  }
}

// Calculate satisfaction for each alternative
export function calculateAlternativeSatisfaction(projectTree, alternativeValues, debug = false, options = {}) {
  // Default options
  const {
    scaleFactor = 100, 
    aggregationType = null
  } = options;
  
  // Prepare a copy of the tree with alternative values inserted
  const treeWithValues = JSON.parse(JSON.stringify(projectTree)); // Deep copy
  
  if (debug) {
    console.log('Tree structure before inserting values:', treeWithValues);
    console.log('Alternative values to insert:', alternativeValues);
    console.log('Options:', { scaleFactor, aggregationType });
  }
  
  // Function to recursively insert values into leaf nodes
  const insertValues = (node, values) => {
    if (!node) return null;
    
    const newNode = { ...node };
    
    // If custom aggregation type is specified, override the node's connector
    if (aggregationType && !newNode.isLeaf && (!newNode.children || newNode.children.length === 0)) {
      newNode.connector = aggregationType;
    }
    
    if (newNode.isLeaf || (!newNode.children || newNode.children.length === 0)) {
      // This is a leaf node - add value from alternativeValues if available
      if (values && values[newNode.id]) {
        newNode.value = Number(values[newNode.id]);
        
        // Try to get preference data from the node itself or derive it
        if (!newNode.preferenceType) {
          // Default to increasing if not specified
          newNode.preferenceType = "increasing";
        }
        
        // Apply scale factor to minAcceptable and maxAcceptable
        if (scaleFactor && scaleFactor < 100) {
          if (!newNode.minAcceptable) newNode.minAcceptable = 0;
          if (!newNode.maxAcceptable) newNode.maxAcceptable = Number(scaleFactor);
        }
        
        if (debug) {
          console.log(`Setting value ${newNode.value} for leaf ${newNode.id}`);
          if (scaleFactor < 100) {
            console.log(`Applied scale factor: min=${newNode.minAcceptable}, max=${newNode.maxAcceptable}`);
          }
        }
      }
      
      // Mark it explicitly as a leaf for the evaluator
      newNode.isLeaf = true;
      return newNode;
    } else {
      // This is an internal node - process its children
      newNode.children = node.children.map(child => insertValues(child, values));
      
      // If custom aggregation type is specified, override the node's connector
      if (aggregationType) {
        newNode.connector = aggregationType;
        if (debug) {
          console.log(`Setting connector type ${aggregationType} for node ${newNode.id || newNode.name}`);
        }
      }
      
      return newNode;
    }
  };
  
  // Insert values and then evaluate
  const treeForEvaluation = insertValues(treeWithValues, alternativeValues);
  
  if (debug) {
    console.log('Tree structure after inserting values:', treeForEvaluation);
  }
  
  const satisfaction = evaluateNode(treeForEvaluation, debug);
  
  return parseFloat(satisfaction.toFixed(2)); // Return satisfaction with 2 decimal places
}

// Convert satisfaction score to qualitative label
export function getQualitativeSatisfaction(score) {
  if (score >= 0.9) return "Highest";
  if (score >= 0.75) return "Very high";
  if (score >= 0.6) return "High";
  if (score >= 0.4) return "Medium";
  if (score >= 0.25) return "Low";
  if (score >= 0.1) return "Very low";
  return "Lowest";
}

// Calculate satisfaction for a single attribute (leaf node)
export function calculateAttributeSatisfaction(attributeInfo, value) {
  // Create a simple leaf node structure
  const leafNode = {
    isLeaf: true,
    value: Number(value),
    preferenceType: attributeInfo.preferenceType || "increasing",
  };
  
  // Add appropriate range parameters based on preference type
  if (attributeInfo.preferenceType === "range") {
    leafNode.idealMin = attributeInfo.idealMin || attributeInfo.lower || DEFAULT_DOMAIN_MIN;
    leafNode.idealMax = attributeInfo.idealMax || attributeInfo.upper || DEFAULT_DOMAIN_MAX;
    leafNode.minAcceptable = attributeInfo.minAcceptable || 0;
    leafNode.maxAcceptable = attributeInfo.maxAcceptable || 100;
  } else if (attributeInfo.preferenceType === "increasing") {
    leafNode.minAcceptable = attributeInfo.minAcceptable || 0;
    leafNode.maxAcceptable = attributeInfo.maxAcceptable || 100;
  } else if (attributeInfo.preferenceType === "decreasing") {
    leafNode.minAcceptable = attributeInfo.minAcceptable || 0;
    leafNode.maxAcceptable = attributeInfo.maxAcceptable || 100;
  }
  
  return parseFloat(evaluateNode(leafNode).toFixed(2));
}