// Helper function to identify children of a parent based on node numbers
const getChildrenNodeNumbers = (parentNodeNumber, allNodes) => {
  if (!parentNodeNumber || parentNodeNumber === "-") return [];
  
  const children = [];
  
  allNodes.forEach(node => {
    const nodeNum = node.nodeNumber;
    if (!nodeNum || nodeNum === "-" || nodeNum === parentNodeNumber) return;
    
    // Check if this node is a direct child of the parent
    // A node is a child if it starts with parent's number and has exactly one more digit/level
    if (nodeNum.startsWith(parentNodeNumber)) {
      const remainingPart = nodeNum.substring(parentNodeNumber.length);
      
      // For direct children, remaining part should be a single digit or level
      // Examples: 
      // Parent "1" -> children "11", "12", "13", etc.
      // Parent "11" -> children "111", "112", "113", etc.
      // Parent "121" -> children "1211", "1212", "1213", etc.
      
      if (remainingPart.length === 1 && /^\d$/.test(remainingPart)) {
        children.push(node);
      } else if (remainingPart.length === 2 && /^\d{2}$/.test(remainingPart)) {
        // Handle cases like 121 -> 1211, 1212
        const expectedLength = parentNodeNumber.length + 1;
        if (nodeNum.length === expectedLength + 1) {
          children.push(node);
        }
      }
    }
  });
  
  return children;
};

// Calculate parent satisfaction as average of children satisfactions
export const calculateParentSatisfaction = (parentNode, allNodes, evaluations, calculateChildSatisfaction) => {
  const children = getChildrenNodeNumbers(parentNode.nodeNumber, allNodes);
  
  if (children.length === 0) {
    return null; // No children, so no satisfaction to calculate
  }
  
  const parentSatisfactions = {};
  
  // Calculate satisfaction for each alternative
  evaluations.forEach(evaluation => {
    let totalSatisfaction = 0;
    let validChildren = 0;
    
    children.forEach(child => {
      const childSatisfaction = calculateChildSatisfaction(
        child.id.toString(),
        evaluation.alternativeValues ? evaluation.alternativeValues[child.id] : "-"
      );
      
      if (childSatisfaction !== null && childSatisfaction !== undefined) {
        totalSatisfaction += childSatisfaction;
        validChildren++;
      }
    });
    
    // Calculate average satisfaction if we have valid children
    if (validChildren > 0) {
      parentSatisfactions[evaluation._id] = totalSatisfaction / validChildren;
    } else {
      parentSatisfactions[evaluation._id] = null;
    }
  });
  
  return parentSatisfactions;
};

// Helper function to check if a node is a parent (has children)
export const isParentNode = (node, allNodes) => {
  const children = getChildrenNodeNumbers(node.nodeNumber, allNodes);
  return children.length > 0;
};
