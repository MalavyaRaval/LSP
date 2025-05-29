// Example domain extremes for normalization
const DEFAULT_DOMAIN_MIN = 0;
const DEFAULT_DOMAIN_MAX = 100;

// (Q4) Scoring for "increasing values preferred"
export function scoreIncreasing(
  value,
  minVal = DEFAULT_DOMAIN_MIN,
  maxVal = DEFAULT_DOMAIN_MAX,
  specificPoints = []
) {
  value = Number(value);
  minVal = Number(minVal);
  maxVal = Number(maxVal);
  
  if (isNaN(value)) return 0;
  if (value <= minVal) return 0;
  if (value >= maxVal) return 1;
    // If there are specific points defined between min and max
  if (specificPoints && specificPoints.length > 0) {
    // Ensure points are in the right format (with value and satisfaction properties)
    const validPoints = specificPoints.filter(pt => 
      pt && typeof pt.value !== 'undefined' && typeof pt.satisfaction !== 'undefined'
    );
        
    // Add boundary points to the array for interpolation
    const allPoints = [
      { value: minVal, satisfaction: 0 },
      ...validPoints.filter(pt => pt.value > minVal && pt.value < maxVal),
      { value: maxVal, satisfaction: 1 }
    ];
    
    // Sort points by value (ascending)
    allPoints.sort((a, b) => a.value - b.value);
    
    // Find the segment where our value falls
    for (let i = 0; i < allPoints.length - 1; i++) {
      const point1 = allPoints[i];
      const point2 = allPoints[i + 1];
      
      if (value >= point1.value && value <= point2.value) {
        // Linear interpolation between the two points
        return point1.satisfaction + 
          ((value - point1.value) / (point2.value - point1.value)) * 
          (point2.satisfaction - point1.satisfaction);
      }
    }
  }
  
  // Default linear interpolation between min and max
  return (value - minVal) / (maxVal - minVal);
}

// (Q5) Scoring for "decreasing values preferred"
export function scoreDecreasing(
  value,
  minVal = DEFAULT_DOMAIN_MIN,
  maxVal = DEFAULT_DOMAIN_MAX,
  specificPoints = []
) {
  value = Number(value);
  minVal = Number(minVal);
  maxVal = Number(maxVal);
  
  if (isNaN(value)) return 0;
  if (value <= minVal) return 1;
  if (value >= maxVal) return 0;
  
  // If there are specific points defined between min and max
  if (specificPoints && specificPoints.length > 0) {
    // Ensure points are in the right format (with value and satisfaction properties)
    const validPoints = specificPoints.filter(pt => 
      pt && typeof pt.value !== 'undefined' && typeof pt.satisfaction !== 'undefined'
    );
        
    // Add boundary points to the array for interpolation
    const allPoints = [
      { value: minVal, satisfaction: 1 },
      ...validPoints.filter(pt => pt.value > minVal && pt.value < maxVal),
      { value: maxVal, satisfaction: 0 }
    ];
    
    // Sort points by value (ascending)
    allPoints.sort((a, b) => a.value - b.value);
    
    // Find the segment where our value falls
    for (let i = 0; i < allPoints.length - 1; i++) {
      const point1 = allPoints[i];
      const point2 = allPoints[i + 1];
      
      if (value >= point1.value && value <= point2.value) {
        // Linear interpolation between the two points
        return point1.satisfaction + 
          ((value - point1.value) / (point2.value - point1.value)) * 
          (point2.satisfaction - point1.satisfaction);
      }
    }
  }
  
  // Default linear interpolation between min and max
  return (maxVal - value) / (maxVal - minVal);
}

// (Q6) Scoring for "specific range preferred" with four values (A, B, C, D)
export function scoreInRange(
  value,
  A,
  B,
  C,
  D,
  outsideMin = DEFAULT_DOMAIN_MIN,
  outsideMax = DEFAULT_DOMAIN_MAX
) {
  value = Number(value);
  A = Number(A);
  B = Number(B);
  C = Number(C);
  D = Number(D);
  outsideMin = Number(outsideMin);
  outsideMax = Number(outsideMax);

  if (isNaN(value)) return 0;

  if (value < A) return 0;

  if (value >= A && value < B) {
    return (value - A) / (B - A);
  }

  if (value >= B && value < C) return 1;

  if (value >= C && value < D) {
    return (D - value) / (D - C);
  }

  if (value >= D) return 0;

  return 0;
}
