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

// (Q7) Scoring for "specific range preferred" with n values (n1, n2, n3, ..., nN)
export function scoreInRangeN(
  values,
  outsideMin = DEFAULT_DOMAIN_MIN,
  outsideMax = DEFAULT_DOMAIN_MAX
) {
  values = values.map(Number);
  outsideMin = Number(outsideMin);
  outsideMax = Number(outsideMax);

  if (values.some(isNaN)) return 0;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  if (minVal < outsideMin || maxVal > outsideMax) return 0;

  const range = maxVal - minVal;
  if (range === 0) return 1;

  return (
    values.reduce((acc, val) => acc + (val - minVal), 0) /
    (values.length * range)
  );
}
