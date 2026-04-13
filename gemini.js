const axios = require("axios");
const fs = require("fs");
const glob = require("glob");

const API_KEY = process.env.GEMINI_API_KEY;

const allowedExtensions = [".html", ".css", ".js"];

function shouldProcess(file) {
  return allowedExtensions.some(ext => file.endsWith(ext)) &&
         !file.includes("node_modules") &&
         !file.includes("package") &&
         !file.includes(".git");
}

async function improveFile(filePath) {
  try {
    const original = fs.readFileSync(filePath, "utf-8");

    if (original.length > 20000 || original.length < 10) return;

    const prompt = `Improve this code professionally. Keep functionality identical. Return ONLY code:\n${original}`;

    const res = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    let output = res.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    output = output
      .replace(/^`{3}.*\n/i, "")
      .replace(/\n`{3}$/i, "")
      .trim();

    // 🔒 حماية: لا تكتب إلا إذا التغيير منطقي
    if (output.length > 20 && output !== original) {
      fs.writeFileSync(filePath, output);
      console.log("Updated:", filePath);
    }

  } catch (err) {
    console.log("Error:", filePath);
  }
}

async function main() {
  const files = glob.sync("**/*", { nodir: true });

  for (const file of files) {
    if (shouldProcess(file)) {
      await improveFile(file);
    }
  }
}

main();
