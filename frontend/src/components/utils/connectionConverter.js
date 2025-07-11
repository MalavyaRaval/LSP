export const getConnectionOptions = (type) => {
  const optionsMap = {
    HC: ["HC++", "HC+", "HC", "HC-"],
    SC: ["SC+", "SC", "SC-"],
    SD: ["SD+", "SD", "SD-"],
    HD: ["HD++", "HD+", "HD", "HD-"],
    A: ["A"],
  };
  return optionsMap[type] || [];
};

export const getLabelForConnection = (connection) => {
  const labels = {
    "HC++": "Extreme (Using only the smallest value)",
    "HC+": "High",
    HC: "Medium",
    "HC-": "Low",
    "SC+": "High",
    SC: "Medium",
    "SC-": "Low",
    "SD+": "High",
    SD: "Medium",
    "SD-": "Low",
    "HD++": "Extreme (Using only the largest value)",
    "HD+": "High",
    HD: "Medium",
    "HD-": "Low",
    A: "Arithmetic Mean",
  };
  return labels[connection] || connection;
};
