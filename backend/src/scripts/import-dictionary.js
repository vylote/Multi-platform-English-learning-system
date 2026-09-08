const fs = require("fs");
const readline = require("readline");
require("dotenv").config();
const db = require("../config/db");

const FILE_PATH = process.argv[2] || "./data/stardict_en_vi.txt";
const BATCH_SIZE = 500;

const POS_MAP = {
  "danh từ": "noun",
  "động từ": "verb",
  "nội động từ": "verb",
  "ngoại động từ": "verb",
  "tính từ": "adjective",
  "phó từ": "adverb",
  "giới từ": "preposition",
  "liên từ": "conjunction",
  "thán từ": "interjection",
  "đại từ": "pronoun",
  "mạo từ": "article",
  "số từ": "numeral",
};

const POS_NAMES = [
  "nội động từ",
  "ngoại động từ",
  "động từ",
  "danh từ",
  "tính từ",
  "phó từ",
  "giới từ",
  "liên từ",
  "thán từ",
  "đại từ",
  "mạo từ",
  "số từ",
];
// Sắp theo độ dài giảm dần -> ưu tiên khớp cụm dài hơn trước (vd "nội động từ" trước "động từ")
const SORTED_POS_NAMES = [...POS_NAMES].sort((a, b) => b.length - a.length);

function extractPosName(rawPosText) {
  const text = rawPosText.trim();
  for (const pos of SORTED_POS_NAMES) {
    if (text.startsWith(pos)) return pos;
  }
  return text; // Không khớp mẫu nào -> giữ nguyên, hiếm gặp, nên rà soát log riêng
}

function normalizePos(posText) {
  const posName = extractPosName(posText); // "tính từ farther,..." -> "tính từ"
  const mapped = POS_MAP[posName];
  return mapped || truncate(posName, 100); // fallback giờ cũng đã sạch, không còn dính đuôi
}

function parseLine(rawLine) {
  const line = rawLine.replace(/\r$/, "");
  const tabIndex = line.indexOf("\t"); //TODO: tôi ưu hơn split("\t") vì indexOf("\t") tìm tab đầu tiên rồi cắt chuỗi
  if (tabIndex === -1) return null;

  const word = line.slice(0, tabIndex).trim();
  if (!word) return null;

  const rawDef = line.slice(tabIndex + 1);
  const tokens = rawDef
    .split("\\n")
    .map((t) => t.trim())
    .filter(Boolean);

  let pronunciation = "";
  const phoneticMatch = (tokens[0] || "").match(/\/[^/]+\//);
  if (phoneticMatch) pronunciation = phoneticMatch[0];

  let partOfSpeech = "";
  let firstPosText = null;
  const meanings = [];
  let collecting = true;

  const startIndex = phoneticMatch ? 1 : 0;

  for (let i = startIndex; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.startsWith("!")) break;

    if (t.startsWith("*")) {
      const posText = t.replace(/^\*\s*/, "").trim();
      if (firstPosText === null) {
        firstPosText = posText;
        partOfSpeech = normalizePos(posText); // dùng hàm mới
        collecting = true;
      } else {
        collecting = posText === firstPosText;
      }
      continue;
    }
    if (t.startsWith("=")) continue;
    if (t.startsWith("@")) continue;
    if (t.startsWith("-") && collecting) {
      meanings.push(t.replace(/^-\s*/, "").trim());
      if (meanings.length >= 5) break;
    }
  }

  if (meanings.length === 0) return null;

  return {
    word: truncate(word, 150),
    pronunciation: truncate(pronunciation, 150),
    part_of_speech: partOfSpeech,
    meaning_vi: meanings.join(", "),
  };
}

function truncate(str, maxLen) {
  if (!str) return str;
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

async function importDictionary() {
  console.log(`Bắt đầu import từ: ${FILE_PATH}`);
  const fileStream = fs.createReadStream(FILE_PATH); //TODO: tạo stream đọc từng block data
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity, //TODO: Chuẩn hóa kí tự xuống dòng WIN(\r\n), Linux, MacOS(\n)
  });

  let batch = [];
  let totalImported = 0;
  let totalSkipped = 0;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      for (const entry of batch) {
        await client.query(
          `INSERT INTO words (word, pronunciation, part_of_speech, meaning_vi)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (LOWER(word)) DO UPDATE 
     SET 
       pronunciation = EXCLUDED.pronunciation,
       part_of_speech = EXCLUDED.part_of_speech,
       meaning_vi = EXCLUDED.meaning_vi`,
          [
            entry.word,
            entry.pronunciation,
            entry.part_of_speech,
            entry.meaning_vi,
          ],
        );
      }
      await client.query("COMMIT");
      totalImported += batch.length;
      console.log(`Đã import: ${totalImported} từ...`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Lỗi khi import batch:", error.message);
    } finally {
      client.release();
      batch = [];
    }
  };

  for await (const line of rl) {
    const parsed = parseLine(line);
    if (!parsed) {
      totalSkipped++;
      continue;
    }
    batch.push(parsed);
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }
  await flushBatch();

  console.log(
    `\nHoàn tất. Đã import: ${totalImported} từ. Bỏ qua (không parse được): ${totalSkipped} dòng.`,
  );
  await db.pool.end();
}

importDictionary().catch((err) => {
  console.error("Lỗi import:", err);
  process.exit(1);
});
