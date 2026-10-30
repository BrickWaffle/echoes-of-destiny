import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

const root = process.cwd();
const moves = JSON.parse(await fs.readFile(path.join(root, "src/compendium-moves.json"), "utf8"));
const books = JSON.parse(await fs.readFile(path.join(root, "src/compendium-playbooks.json"), "utf8"));
const idFor = value => createHash("sha256").update(value).digest("hex").slice(0, 16);
const packs = [
  ["basic-moves", moves.basicMoves],
  ["playbook-moves", moves.playbookMoves],
  ["playbooks", books.playbooks]
];
const moveById = new Map(moves.playbookMoves.map(move => [move.id, move]));
for (const [pack, entries] of packs) {
  const source = path.join(root, "src", "system-packs", pack);
  const target = path.join(root, "system-packs", pack);
  await fs.rm(source, {recursive: true, force: true});
  await fs.rm(target, {recursive: true, force: true});
  await fs.mkdir(source, {recursive: true});
  const folderIds = new Map();
  if (pack === "playbook-moves") {
    for (const name of [...new Set(entries.map(entry => entry.playbook))].sort()) {
      folderIds.set(name, idFor("folder:" + name));
    }
  }
  for (const [name, id] of folderIds) {
    const folder = {_id: id, _key: "!folders!" + id, name, type: "Item", sorting: "a", sort: 0, color: "#d6a43b"};
    await fs.writeFile(path.join(source, "folder-" + id + ".json"), JSON.stringify(folder, null, 2) + "\n");
  }
  for (const entry of entries) {
    const playbook = pack === "playbooks";
    const sourceId = playbook ? "eod-playbook-" + entry.slug : entry.id;
    const description = playbook ? entry.theme : entry.text;
    const system = playbook ? {
      description, signatureMove: entry.signature,
      optionalMoves: entry.optional,
      echoQuestions: entry.echoes,
      abilityIncrease: entry.abilityIncrease,
      slug: entry.slug
    } : {
      description,
      category: entry.kind,
      trigger: entry.text,
      results: entry.results ?? {},
      playbook: entry.playbook ?? ""
    };
    const document = {
      _id: idFor(sourceId),
      _key: "!items!" + idFor(sourceId),
      name: entry.name,
      type: playbook ? "playbook" : "move",
      img: playbook ? "icons/svg/book.svg" : "icons/svg/d20.svg",
      system,
      ...(folderIds.has(entry.playbook) ? {folder: folderIds.get(entry.playbook)} : {}),
      flags: {"echoes-of-destiny": {sourceId}}
    };
    await fs.writeFile(path.join(source, sourceId + ".json"), JSON.stringify(document, null, 2) + "\n");
  }
  await compilePack(source, target, {log: true});
  const verify = path.join(root, ".pack-verify-system", pack);
  await fs.rm(verify, {recursive: true, force: true});
  await extractPack(target, verify, {log: false});
  const docs = (await fs.readdir(verify, {recursive: true})).filter(name => name.endsWith(".json"));
  if (docs.length !== entries.length) throw new Error(pack + ": roundtrip document count mismatch");
  await fs.rm(verify, {recursive: true, force: true});
  console.log(pack + ": " + entries.length + " native Items");
}
