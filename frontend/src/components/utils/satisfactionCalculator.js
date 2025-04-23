// Example domain extremes for normalization
const DEFAULT_DOMAIN_MIN = 0;
const DEFAULT_DOMAIN_MAX = 100;

// (Q4) Scoring for "increasing values preferred"
export function scoreIncreasing(
  value,
  minVal = DEFAULT_DOMAIN_MIN,
  maxVal = DEFAULT_DOMAIN_MAX
) {
  value = Number(value);
  minVal = Number(minVal);
  maxVal = Number(maxVal);
  if (isNaN(value)) return 0;
  if (value <= minVal) return 0;
  if (value >= maxVal) return 1;
  return (value - minVal) / (maxVal - minVal);
}

// (Q5) Scoring for "decreasing values preferred"
export function scoreDecreasing(
  value,
  minVal = DEFAULT_DOMAIN_MIN,
  maxVal = DEFAULT_DOMAIN_MAX
) {
  value = Number(value);
  minVal = Number(minVal);
  maxVal = Number(maxVal);
  if (isNaN(value)) return 0;
  if (value <= minVal) return 1;
  if (value >= maxVal) return 0;
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

// (Q7) Function to calculate satisfaction percentage based on given value and range of points
export function scoreBasedOnRange(value, range) {
  // Sort the range of points in case it's not sorted
  range.sort((a, b) => a.value - b.value);

  // Check if the value is smaller than the first point
  if (value <= range[0].value) return range[0].percentage;

  // Check if the value is larger than the last point
  if (value >= range[range.length - 1].value) return range[range.length - 1].percentage;

  // Loop through the range to find the two closest points for interpolation
  for (let i = 0; i < range.length - 1; i++) {
    const point1 = range[i];
    const point2 = range[i + 1];

    // Check if the value lies between point1 and point2
    if (value >= point1.value && value <= point2.value) {
      // Linear interpolation: Calculate the percentage based on the position between point1 and point2
      const percentage = point1.percentage + 
        ((value - point1.value) / (point2.value - point1.value)) * (point2.percentage - point1.percentage);
      return percentage;
    }
  }

  // Default return (shouldn't hit this, but it's safe to have it)
  return 0;
}
