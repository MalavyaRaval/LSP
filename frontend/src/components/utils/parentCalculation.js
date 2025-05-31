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
          importance: child.attributes?.importance || 1 // Default importance to 1 if not specified
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
    "CPA": arithmeticMean, // CPA (using arithmetic mean for now)
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
 * @returns {number} Aggregated satisfaction (0-1)
 */
export const calculateAggregatedSatisfaction = (satisfactionValues, weights, connectionValue) => {
  if (satisfactionValues.length !== weights.length) {
    throw new Error('Satisfaction values and weights arrays must have the same length');
  }
  
  if (satisfactionValues.length === 0) {
    return null;
  }
  
  // Get the appropriate aggregation function based on connection type
  const aggregationFunction = getAggregationFunction(connectionValue);
  
  // Calculate aggregated satisfaction
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
    
    if (parentInfo && parentInfo.children && parentInfo.children.length > 0) {
      // Get satisfaction values and importance weights for all children
      const childrenData = parentInfo.children
        .map(childInfo => ({
          satisfaction: allSatisfactions[childInfo.id],
          importance: childInfo.importance
        }))
        .filter(child => child.satisfaction !== null && child.satisfaction !== undefined);
      
      if (childrenData.length > 0) {
        // Extract satisfaction values and importance weights
        const satisfactionValues = childrenData.map(child => child.satisfaction);
        const importanceValues = childrenData.map(child => child.importance);
        
        // Calculate normalized weights
        const normalizedWeights = calculateNormalizedWeights(importanceValues);        // Calculate aggregated satisfaction using connection-based method
        const aggregatedSatisfaction = calculateAggregatedSatisfaction(
          satisfactionValues, 
          normalizedWeights, 
          parentInfo.connection
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