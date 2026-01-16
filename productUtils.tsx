export function getProductBadgeClass(name: string): string {
  const upperName = name.toUpperCase();
  
  if (upperName.includes("TW")) {
    return "bg-gradient-to-r from-orange-500/40 to-blue-500/40 text-white border-0";
  }
  
  const tempMatch = name.match(/(\d+(?:[,\.]\d+)?)K/i);
  if (tempMatch) {
    const tempStr = tempMatch[1].replace(",", ".");
    const temp = parseFloat(tempStr);
    
    if (temp >= 5) {
      return "bg-blue-500/30 text-blue-200 border-blue-500/40";
    }
    if (temp >= 4) {
      return "bg-sky-400/30 text-sky-200 border-sky-400/40";
    }
    if (temp >= 3.5) {
      return "bg-yellow-500/30 text-yellow-200 border-yellow-500/40";
    }
    if (temp >= 3) {
      return "bg-orange-500/30 text-orange-200 border-orange-500/40";
    }
  }
  
  return "";
}

export function getProductNameClass(name: string): string {
  const upperName = name.toUpperCase();
  
  if (upperName.includes("TW")) {
    return "font-semibold text-transparent bg-clip-text inline-block [background-image:linear-gradient(to_right,#f97316_0%,#3b82f6_100%)] [background-size:100%]";
  }
  
  const tempMatch = name.match(/(\d+(?:[,\.]\d+)?)K/i);
  if (tempMatch) {
    const tempStr = tempMatch[1].replace(",", ".");
    const temp = parseFloat(tempStr);
    
    if (temp >= 5) {
      return "text-blue-400 font-semibold";
    }
    if (temp >= 4) {
      return "text-[#a5d8ff] font-semibold";
    }
    if (temp >= 3.5) {
      return "text-yellow-300";
    }
    if (temp >= 3) {
      return "text-orange-400";
    }
  }
  
  return "";
}
