const MODULE_ID = "echoes-tag-state";
const FLAG_KEY = "tags";

function readTags(actor) {
  const value = actor.getFlag(MODULE_ID, FLAG_KEY);
  return Array.isArray(value) ? foundry.utils.deepClone(value) : [];
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderTracker(actor) {
  const tags = readTags(actor);
  const rows = tags.map((tag, index) => `
    <li class="eod-tag-row ${tag.available ? "is-available" : "is-unavailable"}">
      <span class="eod-tag-name">${escapeHtml(tag.name)}</span>
      <span class="eod-tag-state">${tag.available ? "Available" : "Unavailable"}</span>
      <button type="button" data-action="toggle" data-index="${index}">
        ${tag.available ? "Mark Unavailable" : "Restore"}
      </button>
      <button type="button" data-action="remove" data-index="${index}" aria-label="Remove ${escapeHtml(tag.name)}">×</button>
    </li>`).join("");

  return `<section class="eod-tag-tracker">
    <header class="eod-tag-header">
      <h3>Tag Availability</h3>
      <small>Unavailable tags remain true in the fiction but cannot be invoked mechanically.</small>
    </header>
    <ul class="eod-tag-list">${rows || '<li class="eod-tag-empty">No tracked tags yet.</li>'}</ul>
    <form class="eod-tag-add">
      <input name="tagName" type="text" maxlength="100" placeholder="Add a tag…" required>
      <button type="submit">Add Tag</button>
    </form>
  </section>`;
}

Hooks.on("renderActorSheet", (app, html) => {
  const actor = app.actor;
  const root = html?.[0] instanceof HTMLElement
    ? html[0]
    : (html instanceof HTMLElement ? html : null);
  if (!actor || !root || root.querySelector(".eod-tag-tracker")) return;

  const holder = document.createElement("div");
  holder.innerHTML = renderTracker(actor);
  const tracker = holder.firstElementChild;
  const target = root.querySelector(".window-content") || root.querySelector("form") || root;
  target.appendChild(tracker);

  tracker.addEventListener("submit", async event => {
    if (!event.target.matches(".eod-tag-add")) return;
    event.preventDefault();
    if (!actor.isOwner) return ui.notifications.warn("You do not have permission to edit this actor.");
    const input = event.target.elements.namedItem("tagName");
    const name = input?.value?.trim();
    if (!name) return;
    const tags = readTags(actor);
    tags.push({id: foundry.utils.randomID(), name, available: true});
    await actor.setFlag(MODULE_ID, FLAG_KEY, tags);
    app.render(false);
  });

  tracker.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (!actor.isOwner) return ui.notifications.warn("You do not have permission to edit this actor.");
    const index = Number(button.dataset.index);
    const tags = readTags(actor);
    if (!Number.isInteger(index) || index < 0 || index >= tags.length) return;
    if (button.dataset.action === "toggle") tags[index].available = !tags[index].available;
    else if (button.dataset.action === "remove") tags.splice(index, 1);
    else return;
    await actor.setFlag(MODULE_ID, FLAG_KEY, tags);
    app.render(false);
  });
});

Hooks.once("ready", () => {
  if (game.system.id !== "pbta") {
    console.warn(`${MODULE_ID}: designed for the PbtA system.`);
  }
});
