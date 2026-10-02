const MODULE_ID = "echoes-of-destiny";
const FLAG_KEY = "unavailableTagKeys";

function parseItemTags(item) {
  try {
    const raw = item.system?.tags;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : JSON.parse(raw);
  } catch (error) {
    console.warn(`${MODULE_ID}: Could not parse tags for item "${item.name}".`, error);
    return [];
  }
}

function tagKey(index, tag) {
  return `${index}:${String(tag?.value ?? "")}`;
}

function readUnavailable(item) {
  const current = item.getFlag(MODULE_ID, FLAG_KEY);
  return Array.isArray(current) ? current : [];
}

function decorateNativeTags(root, actor) {
  for (const itemRow of root.querySelectorAll(".items-list .item[data-item-id]")) {
    const item = actor.items.get(itemRow.dataset.itemId);
    if (!item || item.type !== "equipment") continue;

    const tagElements = itemRow.querySelectorAll(".item-description .tags .tag");
    const definitions = parseItemTags(item);
    const unavailable = new Set(readUnavailable(item));

    tagElements.forEach((element, index) => {
      const key = tagKey(index, definitions[index]);
      const isUnavailable = unavailable.has(key);
      element.classList.toggle("eod-tag-unavailable", isUnavailable);
      element.classList.add("eod-tag-toggle");
      element.dataset.eodTagIndex = String(index);
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", actor.isOwner ? "0" : "-1");
      element.setAttribute("aria-pressed", String(!isUnavailable));
      element.setAttribute("aria-label", `${element.textContent.trim()}: ${isUnavailable ? "Unavailable" : "Available"}`);
      element.title = `Click to mark ${isUnavailable ? "available" : "unavailable"}`;
    });
  }
}

async function toggleNativeTag(event, app, root) {
  const tagElement = event.target.closest(".item-description .tags .tag.eod-tag-toggle");
  if (!tagElement || !root.contains(tagElement)) return;

  const row = tagElement.closest(".item[data-item-id]");
  const item = row && app.actor.items.get(row.dataset.itemId);
  if (!item || item.type !== "equipment") return;

  event.preventDefault();
  event.stopPropagation();
  if (!app.actor.isOwner) {
    ui.notifications.warn("You do not have permission to change this actor's equipment tags.");
    return;
  }

  const index = Number(tagElement.dataset.eodTagIndex);
  const definitions = parseItemTags(item);
  if (!Number.isInteger(index) || index < 0 || index >= definitions.length) return;

  const key = tagKey(index, definitions[index]);
  const unavailable = new Set(item.getFlag(MODULE_ID, FLAG_KEY) ?? []);
  if (unavailable.has(key)) unavailable.delete(key);
  else unavailable.add(key);

  await item.setFlag(MODULE_ID, FLAG_KEY, [...unavailable]);
  const isUnavailable = unavailable.has(key);
  tagElement.classList.toggle("eod-tag-unavailable", isUnavailable);
  tagElement.setAttribute("aria-pressed", String(!isUnavailable));
  tagElement.setAttribute("aria-label", `${tagElement.textContent.trim()}: ${isUnavailable ? "Unavailable" : "Available"}`);
  tagElement.title = `Click to mark ${isUnavailable ? "available" : "unavailable"}`;
}

Hooks.on("renderActorSheet", (app, html) => {
  const root = html?.[0] instanceof HTMLElement
    ? html[0]
    : (html instanceof HTMLElement ? html : null);
  if (!root || !app.actor || game.system.id !== "pbta") return;

  decorateNativeTags(root, app.actor);
  root.addEventListener("click", event => toggleNativeTag(event, app, root));
  root.addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") &&
        event.target.matches(".item-description .tags .tag.eod-tag-toggle")) {
      event.preventDefault();
      event.target.click();
    }
  });
});

Hooks.once("ready", () => {
  if (game.system.id !== "pbta") {
    console.warn(`${MODULE_ID}: designed for the PbtA system.`);
  }
});
