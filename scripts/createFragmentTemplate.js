import fs from "fs";

const manifest = JSON.parse(fs.readFileSync("assets/fragments_manifest.json", "utf8"));

const template = {
  name: "SpiderMan Reward Template",
  description: "A set of NFT fragments forming a complete Spider-Man artwork.",
  fragments: manifest.map(f => f.url),
  totalFragments: manifest.length,
  createdAt: new Date().toISOString()
};

fs.writeFileSync("assets/reward_template.json", JSON.stringify(template, null, 2));
console.log("✅ Reward template created: assets/reward_template.json");

