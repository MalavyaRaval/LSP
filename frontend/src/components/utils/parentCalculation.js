/**
 * Parent Satisfaction Calculation Utilities
 * Calculates parent node satisfaction based on children's satisfaction percentages
 */

/**
 * Build a map of parent-children relationships from the project tree
 * @param {Object} treeData - The project tree data
 * @returns {Object} Map where keys are parent node IDs and values are arrays of child node IDs
 */
export const buildParentChildrenMap = (treeData) => {
  const parentChildrenMap = {};
  
  const traverse = (node) => {
    if (node.children && node.children.length > 0) {
      // This node is a parent
      parentChildrenMap[node.id.toString()] = node.children.map(child => child.id.toString());
      
      // Recursively traverse children
      node.children.forEach(child => traverse(child));
    }
  };
  
  traverse(treeData);
  return parentChildrenMap;
};

/**
 * Calculate satisfaction for all parent nodes based on children's satisfaction
 * @param {Object} leafSatisfactionMap - Map of leaf node satisfactions {nodeId: satisfactionPercentage}
 * @param {Object} parentChildrenMap - Map of parent-children relationships
 * @param {Array} allNodes - All nodes in the tree (in order)
 * @returns {Object} Map of all node satisfactions including calculated parent satisfactions
 */
export const calculateParentSatisfactions = (leafSatisfactionMap, parentChildrenMap, allNodes) => {
  const allSatisfactions = { ...leafSatisfactionMap };
  
  // Get all parent nodes sorted by depth (deepest first)
  const parentNodes = allNodes.filter(node => 
    parentChildrenMap[node.id.toString()]
  ).reverse(); // Reverse to process deepest nodes first
  
  // Calculate satisfaction for each parent node
  parentNodes.forEach(parentNode => {
    const parentId = parentNode.id.toString();
    const childrenIds = parentChildrenMap[parentId];
    
    if (childrenIds && childrenIds.length > 0) {
      // Get satisfaction values for all children
      const childrenSatisfactions = childrenIds
        .map(childId => allSatisfactions[childId])
        .filter(satisfaction => satisfaction !== null && satisfaction !== undefined);
      
      if (childrenSatisfactions.length > 0) {
        // Calculate average satisfaction of children
        const averageSatisfaction = childrenSatisfactions.reduce((sum, satisfaction) => sum + satisfaction, 0) / childrenSatisfactions.length;
        allSatisfactions[parentId] = averageSatisfaction;
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