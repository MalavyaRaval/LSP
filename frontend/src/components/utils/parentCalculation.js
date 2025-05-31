/**
 * Parent Satisfaction Calculation Utilities
 * Calculates parent node satisfaction based on children's satisfaction percentages
 */

/**
 * Build a map of parent-children relationships from the project tree
 * @param {Object} treeData - The project tree data
 * @returns {Object} Map where keys are parent node IDs and values are objects containing children info and parent connection
 */
export const buildParentChildrenMap = (treeData) => {
  const parentChildrenMap = {};
    const traverse = (node) => {
    if (node.children && node.children.length > 0) {
      // This node is a parent - store children with their importance values and parent's connection
      parentChildrenMap[node.id.toString()] = {
        children: node.children.map(child => ({
          id: child.id.toString(),
          importance: child.attributes?.importance || 1, // Default importance to 1 if not specified
          partialabsorption: child.attributes?.partialabsorption, // Include partial absorption setting
          penaltyreward: child.attributes?.penaltyreward // Include penalty reward setting
        })),
        connection: node.attributes?.connection || "SC" // Default to "SC" if no connection specified
      };
      
      // Recursively traverse children
      node.children.forEach(child => traverse(child));
    }
  };
  
  traverse(treeData);
  return parentChildrenMap;
};

/**
 * Calculate normalized weights from importance values
 * @param {Array} importanceValues - Array of importance values
 * @returns {Array} Array of normalized weights that sum to 1
 */
export const calculateNormalizedWeights = (importanceValues) => {
  // If no importance values or all are zero/null, use equal weights
  const validImportance = importanceValues.filter(val => val && val > 0);
  if (validImportance.length === 0) {
    return importanceValues.map(() => 1 / importanceValues.length);
  }
  
  // Calculate sum of all importance values
  const sum = importanceValues.reduce((total, val) => total + (val || 0), 0);
  
  // Normalize: each weight = importance / sum
  return importanceValues.map(val => (val || 0) / sum);
};

// Define exponent tables for different connection types
const R_HCP = [-7.675, -6.53, -5.75, -5.19];  // HC++ (Hard Conjunction Plus)
const R_HC = [-2.813, -2.539, -2.327, -2.165];  // HC (Hard Conjunction)
const R_HCM = [-1.188, -1.151, -1.101, -1.058]; // HC- (Hard Conjunction Minus)
const R_SC = [-0.721, -0.737, -0.727, -0.712];  // Used for SC+, SC, SC- (Soft Conjunction variants)

/**
 * Get exponent r(n) or R(n) with fallback for n > 5
 * @param {number} n - Number of children
 * @param {Array} table - Exponent table to use
 * @returns {number} Exponent value
 */
const getRValue = (n, table) => {
  const index = Math.min(n, 5) - 2; // Map n to index (0 to 3), cap at 3 for n > 5
  return table[index];
};

/**
 * Calculate power mean
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @param {number} r - Exponent value
 * @returns {number} Power mean result
 */
const powerMean = (values, weights, r) => {
  const weightedSum = values.reduce((sum, value, index) => {
    return sum + (weights[index] * Math.pow(value, r));
  }, 0);
  return Math.pow(weightedSum, 1 / r);
};

/**
 * Calculate arithmetic mean
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} Arithmetic mean result
 */
const arithmeticMean = (values, weights) => {
  return values.reduce((sum, value, index) => {
    return sum + (weights[index] * value);
  }, 0);
};

/**
 * Calculate W1 based on the CPA formula
 * @param {number} P - Penalty value
 * @param {number} R - Reward value
 * @returns {number} W1 coefficient
 */
const calculateW1 = (P, R) => {
  return (2 * R * (1 - P)) / (P + R);
};

/**
 * Calculate W2 based on the CPA formula
 * @param {number} P - Penalty value
 * @param {number} R - Reward value
 * @returns {number} W2 coefficient
 */
const calculateW2 = (P, R) => {
  return (P - R) / (P - R + 2 * P * R);
};

/**
 * Conditional Partial Absorption (CPA) aggregation
 * Uses the new CPA formula with mandatory (x) and optional (y) components
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @param {Array} partialAbsorptions - Array of partial absorption settings ("Mandatory", "Optional", or null)
 * @param {Array} penaltyRewards - Array of penalty/reward objects with penalty and reward properties
 * @returns {number} CPA aggregation result
 */
const cpa = (values, weights, partialAbsorptions, penaltyRewards = null) => {
  if (!partialAbsorptions || partialAbsorptions.length !== values.length) {
    // Fallback to arithmetic mean if no partial absorption data
    return arithmeticMean(values, weights);
  }

  // Separate mandatory and optional components
  const mandatoryData = [];
  const optionalData = [];
  
  for (let i = 0; i < values.length; i++) {
    const data = {
      value: values[i],
      weight: weights[i],
      originalIndex: i,
      penaltyReward: penaltyRewards ? penaltyRewards[i] : null
    };
    
    if (partialAbsorptions[i] === "Mandatory") {
      mandatoryData.push(data);
    } else if (partialAbsorptions[i] === "Optional") {
      optionalData.push(data);
    } else {
      // If no specific setting, treat as mandatory for conservative approach
      mandatoryData.push(data);
    }
  }

  // If no mandatory components, treat all as mandatory
  if (mandatoryData.length === 0) {
    return arithmeticMean(values, weights);
  }

  // For now, we expect exactly one mandatory and one optional component
  // If there are multiple mandatory or optional components, we'll aggregate them first
  let x; // mandatory value
  let y; // optional value
  let P = 0.15; // Default penalty value
  let R = 0.1;  // Default reward value

  if (mandatoryData.length === 1) {
    x = mandatoryData[0].value;
    // Use penalty/reward from the mandatory component if available
    if (mandatoryData[0].penaltyReward) {
      P = mandatoryData[0].penaltyReward.penalty || P;
      R = mandatoryData[0].penaltyReward.reward || R;
    }
  } else {
    // Multiple mandatory components - use weighted average
    const mandatoryValues = mandatoryData.map(d => d.value);
    const mandatoryWeights = mandatoryData.map(d => d.weight);
    const mandatoryWeightSum = mandatoryWeights.reduce((sum, w) => sum + w, 0);
    const normalizedMandatoryWeights = mandatoryWeights.map(w => w / mandatoryWeightSum);
    x = arithmeticMean(mandatoryValues, normalizedMandatoryWeights);
    
    // Use penalty/reward from the first mandatory component with data, or average them
    const mandatoryWithPenaltyReward = mandatoryData.filter(d => d.penaltyReward);
    if (mandatoryWithPenaltyReward.length > 0) {
      const avgPenalty = mandatoryWithPenaltyReward.reduce((sum, d) => sum + (d.penaltyReward.penalty || 0), 0) / mandatoryWithPenaltyReward.length;
      const avgReward = mandatoryWithPenaltyReward.reduce((sum, d) => sum + (d.penaltyReward.reward || 0), 0) / mandatoryWithPenaltyReward.length;
      P = avgPenalty || P;
      R = avgReward || R;
    }
  }

  if (optionalData.length === 0) {
    // No optional components, set y = 0
    y = 0;
  } else if (optionalData.length === 1) {
    y = optionalData[0].value;
    // If penalty/reward is not set from mandatory component, try optional component
    if (P === 0.15 && R === 0.1 && optionalData[0].penaltyReward) {
      P = optionalData[0].penaltyReward.penalty || P;
      R = optionalData[0].penaltyReward.reward || R;
    }
  } else {
    // Multiple optional components - use weighted average
    const optionalValues = optionalData.map(d => d.value);
    const optionalWeights = optionalData.map(d => d.weight);
    const optionalWeightSum = optionalWeights.reduce((sum, w) => sum + w, 0);
    const normalizedOptionalWeights = optionalWeights.map(w => w / optionalWeightSum);
    y = arithmeticMean(optionalValues, normalizedOptionalWeights);
    
    // If penalty/reward is not set from mandatory component, try optional components
    if (P === 0.15 && R === 0.1) {
      const optionalWithPenaltyReward = optionalData.filter(d => d.penaltyReward);
      if (optionalWithPenaltyReward.length > 0) {
        const avgPenalty = optionalWithPenaltyReward.reduce((sum, d) => sum + (d.penaltyReward.penalty || 0), 0) / optionalWithPenaltyReward.length;
        const avgReward = optionalWithPenaltyReward.reduce((sum, d) => sum + (d.penaltyReward.reward || 0), 0) / optionalWithPenaltyReward.length;
        P = avgPenalty || P;
        R = avgReward || R;
      }
    }
  }

  // Calculate W1 and W2 coefficients
  const W1 = calculateW1(P, R);
  const W2 = calculateW2(P, R);

  // Apply the CPA formula
  const numerator = x * (W1 * x + (1 - W1) * y);
  const denominator = W1 * W2 * x + (1 - W1) * W2 * y + (1 - W2) * x;

  // Prevent division by zero
  if (denominator === 0) {
    return x; // Fallback to mandatory value
  }

  const result = numerator / denominator;
  
  // Ensure result is within [0, 1] bounds
  return Math.max(0, Math.min(1, result));
};

/**
 * Hard Conjunction Plus (HC++) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} HCP aggregation result
 */
const hcp = (values, weights) => {
  const r = getRValue(values.length, R_HCP);
  return powerMean(values, weights, r);
};

/**
 * Hard Conjunction (HC) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} HC aggregation result
 */
const hc = (values, weights) => {
  const r = getRValue(values.length, R_HC);
  return powerMean(values, weights, r);
};

/**
 * Hard Conjunction Minus (HC-) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} HCM aggregation result
 */
const hcm = (values, weights) => {
  const r = getRValue(values.length, R_HCM);
  return powerMean(values, weights, r);
};

/**
 * Soft Conjunction Plus (SC+) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} SCP aggregation result
 */
const scp = (values, weights) => {
  const R = getRValue(values.length, R_SC);
  return (1/7) * arithmeticMean(values, weights) + (6/7) * powerMean(values, weights, R);
};

/**
 * Soft Conjunction (SC) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} SC aggregation result
 */
const sc = (values, weights) => {
  const R = getRValue(values.length, R_SC);
  return (3/7) * arithmeticMean(values, weights) + (4/7) * powerMean(values, weights, R);
};

/**
 * Soft Conjunction Minus (SC-) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} SCM aggregation result
 */
const scm = (values, weights) => {
  const R = getRValue(values.length, R_SC);
  return (5/7) * arithmeticMean(values, weights) + (2/7) * powerMean(values, weights, R);
};

/**
 * Helper function to invert satisfaction values (for disjunction)
 * @param {Array} values - Array of satisfaction values (0-1)
 * @returns {Array} Array of inverted satisfaction values
 */
const invert = (values) => {
  return values.map(value => 1 - value);
};

// Disjunction functions using inversion principle

/**
 * Soft Disjunction Plus (SD+) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} SDP aggregation result
 */
const sdp = (values, weights) => {
  return 1 - scp(invert(values), weights);
};

/**
 * Soft Disjunction (SD) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} SD aggregation result
 */
const sd = (values, weights) => {
  return 1 - sc(invert(values), weights);
};

/**
 * Soft Disjunction Minus (SD-) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} SDM aggregation result
 */
const sdm = (values, weights) => {
  return 1 - scm(invert(values), weights);
};

/**
 * Hard Disjunction Plus (HD+) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} HDP aggregation result
 */
const hdp = (values, weights) => {
  return 1 - hcp(invert(values), weights);
};

/**
 * Hard Disjunction (HD) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} HD aggregation result
 */
const hd = (values, weights) => {
  return 1 - hc(invert(values), weights);
};

/**
 * Hard Disjunction Minus (HD-) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} HDM aggregation result
 */
const hdm = (values, weights) => {
  return 1 - hcm(invert(values), weights);
};

/**
 * Hard Disjunction Plus Plus (HD++) aggregation
 * @param {Array} values - Array of satisfaction values (0-1)
 * @param {Array} weights - Array of normalized weights
 * @returns {number} HDPP aggregation result
 */
const hdpp = (values, weights) => {
  return 1 - hcp(invert(values), weights);
};

/**
 * Get the appropriate aggregation function based on connection type
 * @param {string} connectionValue - Connection value from node attributes
 * @returns {Function} Aggregation function to use
 */
const getAggregationFunction = (connectionValue) => {
  // Direct string to function mapping
  const connectionMap = {
    "HC++": hcp,   // HC++
    "HC+": hcp,    // HC+ (using HCP)
    "HC": hc,      // HC
    "HC-": hcm,    // HC-
    "A": arithmeticMean,  // Arithmetic mean
    "SC+": scp,    // SC+
    "SC": sc,      // SC
    "SC-": scm,    // SC-
    "SD-": sdm,    // SD-
    "SD": sd,      // SD
    "SD+": sdp,    // SD+
    "HD-": hdm,    // HD-
    "HD": hd,      // HD
    "HD+": hdp,    // HD+
    "HD++": hdpp,  // HD++
    "CPA": cpa,    // CPA (Conditional Partial Absorption)
  };

  // If connection type is found in the map, use the specific aggregation function
  if (connectionMap[connectionValue]) {
    return connectionMap[connectionValue];
  }
  
  // For any unknown connection types, use arithmetic mean
  return arithmeticMean;
};

/**
 * Calculate aggregated satisfaction based on connection type
 * @param {Array} satisfactionValues - Array of satisfaction percentages (0-1)
 * @param {Array} weights - Array of normalized weights (should sum to 1)
 * @param {number|string} connectionValue - Connection value determining aggregation method
 * @param {Array} partialAbsorptions - Array of partial absorption settings (for CPA)
 * @param {Array} penaltyRewards - Array of penalty/reward objects (for CPA)
 * @returns {number} Aggregated satisfaction (0-1)
 */
export const calculateAggregatedSatisfaction = (satisfactionValues, weights, connectionValue, partialAbsorptions = null, penaltyRewards = null) => {
  if (satisfactionValues.length !== weights.length) {
    throw new Error('Satisfaction values and weights arrays must have the same length');
  }
  
  if (satisfactionValues.length === 0) {
    return null;
  }
  
  // Get the appropriate aggregation function based on connection type
  const aggregationFunction = getAggregationFunction(connectionValue);
  
  // For CPA, pass the partial absorption data and penalty/reward data
  if (connectionValue === "CPA" && partialAbsorptions) {
    return aggregationFunction(satisfactionValues, weights, partialAbsorptions, penaltyRewards);
  }
  
  // For all other connection types, use standard aggregation
  return aggregationFunction(satisfactionValues, weights);
};

/**
 * Calculate weighted mean of satisfaction values (fallback for arithmetic mean)
 * @param {Array} satisfactionValues - Array of satisfaction percentages (0-1)
 * @param {Array} weights - Array of normalized weights (should sum to 1)
 * @returns {number} Weighted mean satisfaction (0-1)
 */
export const calculateWeightedMean = (satisfactionValues, weights) => {
  return calculateAggregatedSatisfaction(satisfactionValues, weights, "SC"); // Default to "SC"
};

/**
 * Calculate satisfaction for all parent nodes based on children's satisfaction using connection-based aggregation
 * @param {Object} leafSatisfactionMap - Map of leaf node satisfactions {nodeId: satisfactionPercentage}
 * @param {Object} parentChildrenMap - Map of parent-children relationships with importance and connection
 * @param {Array} allNodes - All nodes in the tree (in order)
 * @returns {Object} Map of all node satisfactions including calculated parent satisfactions
 */
export const calculateParentSatisfactions = (leafSatisfactionMap, parentChildrenMap, allNodes) => {
  const allSatisfactions = { ...leafSatisfactionMap };
  
  // Get all parent nodes sorted by depth (deepest first)
  const parentNodes = allNodes.filter(node => 
    parentChildrenMap[node.id.toString()]
  ).reverse(); // Reverse to process deepest nodes first
  
  // Calculate satisfaction for each parent node using connection-based aggregation
  parentNodes.forEach(parentNode => {
    const parentId = parentNode.id.toString();
    const parentInfo = parentChildrenMap[parentId];
    
    if (parentInfo && parentInfo.children && parentInfo.children.length > 0) {      // Get satisfaction values, importance weights, and partial absorption settings for all children
      const childrenData = parentInfo.children
        .map(childInfo => ({
          satisfaction: allSatisfactions[childInfo.id],
          importance: childInfo.importance,
          partialabsorption: childInfo.partialabsorption,
          penaltyreward: childInfo.penaltyreward
        }))
        .filter(child => child.satisfaction !== null && child.satisfaction !== undefined);
      
      if (childrenData.length > 0) {
        // Extract satisfaction values, importance weights, partial absorption settings, and penalty/reward settings
        const satisfactionValues = childrenData.map(child => child.satisfaction);
        const importanceValues = childrenData.map(child => child.importance);
        const partialAbsorptions = childrenData.map(child => child.partialabsorption);
        const penaltyRewards = childrenData.map(child => child.penaltyreward);
        
        // Calculate normalized weights
        const normalizedWeights = calculateNormalizedWeights(importanceValues);
        
        // Calculate aggregated satisfaction using connection-based method
        // Pass partial absorption data and penalty/reward data for CPA connections
        const aggregatedSatisfaction = calculateAggregatedSatisfaction(
          satisfactionValues, 
          normalizedWeights, 
          parentInfo.connection,
          partialAbsorptions, // Pass partial absorption settings
          penaltyRewards // Pass penalty/reward settings
        );
        
        allSatisfactions[parentId] = aggregatedSatisfaction;
      } else {
        allSatisfactions[parentId] = null;
      }
    }
  });
  
  return allSatisfactions;
};

/**
 * Calculate satisfaction for a specific alternative across all nodes
 * @param {Array} allNodes - All nodes in the tree
 * @param {Object} alternativeValues - The alternative values for leaf nodes
 * @param {Object} queryDetails - Query details for calculating leaf satisfactions
 * @param {Function} calculateLeafSatisfaction - Function to calculate leaf satisfaction
 * @param {Object} projectTree - The complete project tree
 * @returns {Object} Map of node satisfactions for this alternative
 */
export const calculateAlternativeSatisfactions = (
  allNodes, 
  alternativeValues, 
  queryDetails, 
  calculateLeafSatisfaction, 
  projectTree
) => {
  // First, calculate satisfaction for all leaf nodes
  const leafSatisfactions = {};
  
  allNodes.forEach(node => {
    const nodeId = node.id.toString();
    if (alternativeValues && alternativeValues[node.id] !== undefined) {
      // This is a leaf node with a value
      const satisfaction = calculateLeafSatisfaction(nodeId, alternativeValues[node.id]);
      leafSatisfactions[nodeId] = satisfaction;
    }
  });
  
  // Build parent-children map
  const parentChildrenMap = buildParentChildrenMap(projectTree);
  
  // Calculate parent satisfactions
  const allSatisfactions = calculateParentSatisfactions(leafSatisfactions, parentChildrenMap, allNodes);
  
  return allSatisfactions;
};