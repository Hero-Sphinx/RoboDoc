export const generateMedicalID = (name) => {
  if (!name || name.length < 2) return "XX0000000";
  
  // Get first 2 letters and make them uppercase
  const prefix = name.substring(0, 2).toUpperCase();
  
  // Generate 7 random digits
  const numbers = Math.floor(1000000 + Math.random() * 9000000);
  
  return `${prefix}${numbers}`;
};