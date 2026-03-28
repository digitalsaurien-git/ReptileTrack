export function getPlaceholderImage(animal) {
  if (!animal) return "https://images.unsplash.com/photo-1549480017-d76466a4b7e8";
  
  const text = `${animal.commonName || ''} ${animal.scientificName || ''}`.toLowerCase();
  
  let keyword = "";
  
  if (text.includes("python")) keyword = "python-snake";
  else if (text.includes("boa")) keyword = "boa-constrictor";
  else if (text.includes("gecko")) {
    if (text.includes("leopard")) keyword = "leopard-gecko";
    else if (text.includes("crested") || text.includes("ciliatus")) keyword = "crested-gecko";
    else keyword = "gecko";
  }
  else if (text.includes("pogona") || text.includes("bearded")) keyword = "bearded-dragon";
  else if (text.includes("tortoise") || text.includes("tortue")) keyword = "tortoise";
  else if (text.includes("couleuvre") || text.includes("corn") || text.includes("guttatus") || text.includes("elaphe")) keyword = "corn-snake";
  else if (text.includes("serpent") || text.includes("snake") || text.includes("python") || text.includes("boa")) keyword = "snake";
  else if (text.includes("leachianus") || text.includes("gecko géant")) keyword = "giant-gecko";
  else if (text.includes("chamaeleo") || text.includes("caméléon")) keyword = "chameleon";
  else if (text.includes("drymarchon") || text.includes("indigo")) keyword = "indigo-snake";
  else keyword = "reptile"; // Unsplash 'reptile' to avoid 'tiger' fallback

  // Using a more reliable sig format
  const sig = encodeURIComponent(keyword + "-" + (animal.id || 'default').substring(0, 5));
  return `https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=600&q=80&reptile-type=${keyword}&sig=${sig}`;
}
