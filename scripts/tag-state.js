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


const ACTOR_TAGS_KEY = "actorTags";
const ACTOR_UNAVAILABLE_KEY = "unavailableActorTags";

function actorTagValues(actor) {
  const tags = actor.getFlag(MODULE_ID, ACTOR_TAGS_KEY);
  return Array.isArray(tags) ? tags.filter(tag => typeof tag === "string" && tag.trim()) : [];
}

function actorUnavailableValues(actor) {
  const tags = actor.getFlag(MODULE_ID, ACTOR_UNAVAILABLE_KEY);
  return new Set(Array.isArray(tags) ? tags : []);
}

function placeActorTagPanel(root, panel) {
  // Find the Species field and place the panel before its detail row.
  const all = [...root.querySelectorAll("*")];
  const exactLabel = name => all.find(el =>
    el.children.length === 0 && el.textContent.trim().toLowerCase() === name
  );
  const species = exactLabel("species");
  if (species) {
    let row = species.closest(".form-group, .attribute, .field, li") || species.parentElement;
    const hasOtherDetails = el => {
      const text = el.textContent.toLowerCase();
      return /\blook\b/.test(text) && /\bvice\b/.test(text);
    };
    while (row?.parentElement && !hasOtherDetails(row) && row.parentElement !== root) {
      const parent = row.parentElement;
      if (hasOtherDetails(parent)) row = parent;
      else break;
    }
    if (row?.parentElement) {
      row.parentElement.insertBefore(panel, row);
      return;
    }
  }
  const header = root.querySelector(".sheet-header");
  if (header) header.insertAdjacentElement("afterend", panel);
}
function renderActorTags(root, actor) {
  let panel = root.querySelector(".eod-actor-tags");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "eod-actor-tags";
    panel.setAttribute("aria-label", "Character Tags");
  }
  placeActorTagPanel(root, panel);
  const tags = actorTagValues(actor);
  const unavailable = actorUnavailableValues(actor);
  panel.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = "Character Tags";
  panel.append(heading);

  const list = document.createElement("div");
  list.className = "eod-actor-tag-list";
  for (const value of tags) {
    const chip = document.createElement("span");
    chip.className = "eod-actor-tag" + (unavailable.has(value) ? " eod-tag-unavailable" : "");
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "eod-actor-tag-toggle";
    toggle.dataset.tagValue = value;
    toggle.setAttribute("aria-pressed", String(!unavailable.has(value)));
    toggle.textContent = value;
    toggle.title = unavailable.has(value) ? "Mark Tag available" : "Mark Tag unavailable";
    chip.append(toggle);
    if (actor.isOwner) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "eod-actor-tag-remove";
      remove.dataset.tagValue = value;
      remove.setAttribute("aria-label", "Remove " + value);
      remove.textContent = "×";
      chip.append(remove);
    }
    list.append(chip);
  }
  if (!tags.length) {
    const empty = document.createElement("p");
    empty.className = "eod-actor-tags-empty";
    empty.textContent = "No character Tags added.";
    list.append(empty);
  }
  panel.append(list);

  if (actor.isOwner) {
    const form = document.createElement("div");
    form.className = "eod-actor-tag-form";
    const input = document.createElement("input");
    input.type = "text";
    input.name = "tag";
    input.maxLength = 80;
    input.placeholder = "Add a character Tag";
    input.setAttribute("aria-label", "New character Tag");
    const submit = document.createElement("button");
    submit.type = "button";
    submit.textContent = "Add Tag";
    submit.addEventListener("click", () => addActorTag(actor, input.value, root));
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        addActorTag(actor, input.value, root);
      }
    });
    form.append(input, submit);
    panel.append(form);
  }
}

async function addActorTag(actor, rawValue, root) {
  if (!actor.isOwner) return;
  const value = String(rawValue || "").trim();
  if (!value) return;
  const tags = actorTagValues(actor);
  if (!tags.some(tag => tag.toLocaleLowerCase() === value.toLocaleLowerCase())) {
    await actor.setFlag(MODULE_ID, ACTOR_TAGS_KEY, [...tags, value]);
  }
  renderActorTags(root, actor);
}

async function handleActorTagEvent(event, root, actor) {
  const panel = event.target.closest(".eod-actor-tags");
  if (!panel || !root.contains(panel)) return;
  const toggle = event.target.closest(".eod-actor-tag-toggle");
  const remove = event.target.closest(".eod-actor-tag-remove");
  if (!toggle && !remove) return;
  event.stopPropagation();
  if (!actor.isOwner || event.type !== "click") return;

  if (toggle) {
    event.preventDefault();
    const value = toggle.dataset.tagValue;
    const unavailable = actorUnavailableValues(actor);
    if (unavailable.has(value)) unavailable.delete(value);
    else unavailable.add(value);
    await actor.setFlag(MODULE_ID, ACTOR_UNAVAILABLE_KEY, [...unavailable]);
    renderActorTags(root, actor);
  } else if (remove) {
    event.preventDefault();
    const value = remove.dataset.tagValue;
    await actor.setFlag(MODULE_ID, ACTOR_TAGS_KEY, actorTagValues(actor).filter(tag => tag !== value));
    const unavailable = actorUnavailableValues(actor);
    unavailable.delete(value);
    await actor.setFlag(MODULE_ID, ACTOR_UNAVAILABLE_KEY, [...unavailable]);
    renderActorTags(root, actor);
  }
}

Hooks.on("renderActorSheet", (app, html) => {
  const root = html?.[0] instanceof HTMLElement
    ? html[0]
    : (html instanceof HTMLElement ? html : null);
  if (!root || !app.actor || game.system.id !== "pbta") return;

  decorateNativeTags(root, app.actor);
  renderActorTags(root, app.actor);
  root.addEventListener("click", event => { toggleNativeTag(event, app, root); handleActorTagEvent(event, root, app.actor); });
  root.addEventListener("submit", event => handleActorTagEvent(event, root, app.actor));
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
