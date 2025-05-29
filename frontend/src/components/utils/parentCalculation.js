/**
 * Parent Satisfaction Calculation Utilities
 * Calculates parent node satisfaction based on children's satisfaction percentages
 */

/**
 * Build a map of parent-children relationships from the project tree
 * @param {Object} treeData - The project tree data
 * @returns {Object} Map where keys are parent node IDs and values are arrays of child objects with id and importance
 */
export const buildParentChildrenMap = (treeData) => {
  const parentChildrenMap = {};
  
  const traverse = (node) => {
    if (node.children && node.children.length > 0) {
      // This node is a parent - store children with their importance values
      parentChildrenMap[node.id.toString()] = node.children.map(child => ({
        id: child.id.toString(),
        importance: child.attributes?.importance || 1 // Default importance to 1 if not specified
      }));
      
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

/**
 * Calculate weighted mean of satisfaction values
 * @param {Array} satisfactionValues - Array of satisfaction percentages (0-1)
 * @param {Array} weights - Array of normalized weights (should sum to 1)
 * @returns {number} Weighted mean satisfaction (0-1)
 */
export const calculateWeightedMean = (satisfactionValues, weights) => {
  if (satisfactionValues.length !== weights.length) {
    throw new Error('Satisfaction values and weights arrays must have the same length');
  }
  
  if (satisfactionValues.length === 0) {
    return null;
  }
  
  // Calculate weighted sum: Σ(satisfaction_i * weight_i)
  const weightedSum = satisfactionValues.reduce((sum, satisfaction, index) => {
    return sum + (satisfaction * weights[index]);
  }, 0);
  
  return weightedSum;
};

/**
 * Calculate satisfaction for all parent nodes based on children's satisfaction using weighted mean
 * @param {Object} leafSatisfactionMap - Map of leaf node satisfactions {nodeId: satisfactionPercentage}
 * @param {Object} parentChildrenMap - Map of parent-children relationships with importance
 * @param {Array} allNodes - All nodes in the tree (in order)
 * @returns {Object} Map of all node satisfactions including calculated parent satisfactions
 */
export const calculateParentSatisfactions = (leafSatisfactionMap, parentChildrenMap, allNodes) => {
  const allSatisfactions = { ...leafSatisfactionMap };
  
  // Get all parent nodes sorted by depth (deepest first)
  const parentNodes = allNodes.filter(node => 
    parentChildrenMap[node.id.toString()]
  ).reverse(); // Reverse to process deepest nodes first
  
  // Calculate satisfaction for each parent node using weighted mean
  parentNodes.forEach(parentNode => {
    const parentId = parentNode.id.toString();
    const childrenInfo = parentChildrenMap[parentId];
    
    if (childrenInfo && childrenInfo.length > 0) {
      // Get satisfaction values and importance weights for all children
      const childrenData = childrenInfo
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
        const normalizedWeights = calculateNormalizedWeights(importanceValues);
        
        // Calculate weighted mean satisfaction
        const weightedSatisfaction = calculateWeightedMean(satisfactionValues, normalizedWeights);
        allSatisfactions[parentId] = weightedSatisfaction;
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