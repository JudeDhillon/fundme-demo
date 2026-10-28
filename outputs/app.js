(() => {
  const STORAGE_KEY = "fundme-static-demo-v1";
  const samplePitches = [
    { id: "sample-climate", name: "TerraKind", sector: "Climate", stage: "Pre-seed", location: "Bengaluru", description: "Helping small farms turn healthier soil into a more resilient future.", saved: false, intros: [] },
    { id: "sample-health", name: "Morrow Health", sector: "Health", stage: "Seed", location: "Mumbai", description: "Making everyday mental wellness feel more personal and easier to access.", saved: false, intros: [] },
    { id: "sample-education", name: "Open Atlas", sector: "Education", stage: "Idea", location: "Pune", description: "A playful learning space that helps every curious mind find its path.", saved: false, intros: [] },
    { id: "sample-food", name: "Good Grain", sector: "Food", stage: "Pre-seed", location: "Delhi", description: "Better-for-you staples made with ingredients grown closer to home.", saved: false, intros: [] },
    { id: "sample-fintech", name: "Pocketwise", sector: "Fintech", stage: "Seed", location: "Hyderabad", description: "Simple tools to help first-time earners feel more confident with money.", saved: false, intros: [] }
  ];
  const $ = (selector) => document.querySelector(selector);
  const pitchGrid = $("#pitch-grid");
  const emptyState = $("#empty-state");
  const requestList = $("#request-list");
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  function initialState() {
    return { role: "investor", profileName: "", view: "discover", noticeDismissed: false, pitches: samplePitches.map((pitch) => ({ ...pitch, intros: [] })) };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return initialState();
      const data = JSON.parse(saved);
      if (!data || !Array.isArray(data.pitches) || !["investor", "founder"].includes(data.role)) return initialState();
      const ids = new Set();
      const pitches = data.pitches.filter((pitch) => pitch && typeof pitch.id === "string" && !ids.has(pitch.id) && ids.add(pitch.id))
        .map((pitch) => ({
          id: pitch.id,
          name: String(pitch.name || "Untitled").slice(0, 60),
          sector: ["Climate", "Health", "Education", "Food", "Fintech"].includes(pitch.sector) ? pitch.sector : "Other",
          stage: ["Idea", "Pre-seed", "Seed"].includes(pitch.stage) ? pitch.stage : "Idea",
          location: String(pitch.location || "Location not shared").slice(0, 60),
          description: String(pitch.description || "").slice(0, 180),
          saved: Boolean(pitch.saved),
          intros: Array.isArray(pitch.intros) ? pitch.intros.filter((item) => item && ["pending", "accepted", "declined"].includes(item.status)).map((item) => ({
            id: String(item.id || ""),
            name: String(item.name || "Demo investor").slice(0, 60),
            status: item.status
          })) : []
        }));
      return {
        role: data.role,
        profileName: typeof data.profileName === "string" ? data.profileName.slice(0, 50) : "",
        view: ["discover", "saved", "inbox"].includes(data.view) ? data.view : "discover",
        noticeDismissed: Boolean(data.noticeDismissed),
        pitches
      };
    } catch (error) {
      console.error("Could not read the Fund Me demo data.", error);
      return initialState();
    }
  }

  let state = loadState();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save Fund Me demo data in this browser.", error);
      alert("Your browser couldn't save this demo change. Check available storage and browser privacy settings.");
    }
  }

  const pendingCount = () => state.pitches.reduce((count, pitch) => count + pitch.intros.filter((intro) => intro.status === "pending").length, 0);
  const savedCount = () => state.pitches.filter((pitch) => pitch.saved).length;
  const introStatus = (pitch) => pitch.intros.find((intro) => intro.status === "pending" || intro.status === "accepted");

  function updateHeader() {
    const founder = state.role === "founder";
    $("#role-label").textContent = founder ? "Founder" : "Investor";
    $("#topbar-role").textContent = founder ? "Founder" : "Investor";
    $("#account-action-label").textContent = state.profileName ? state.profileName : "Create account";
    $("#account-avatar").textContent = state.profileName ? state.profileName.trim().slice(0, 1).toUpperCase() : "+";
    $("#account-action").setAttribute("aria-label", state.profileName ? `Demo profile: ${state.profileName}` : "Create a demo account profile");
    $("#saved-count").textContent = String(savedCount());
    $("#inbox-count").textContent = String(pendingCount());
    $("#create-pitch").hidden = !founder || state.view === "inbox";
    $("#dismiss-notice").closest(".demo-notice").hidden = state.noticeDismissed;
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === state.view));
    const headings = {
      discover: founder
        ? ["YOUR FOUNDER SPACE", "Share what you’re <span>building.</span>", "Create a sample pitch and explore the investor demo."]
        : ["THE DISCOVERY SPACE", "Find your next <span>big idea.</span>", "Explore early-stage companies and discover founders worth knowing."],
      saved: ["YOUR SHORTLIST", "Ideas worth <span>another look.</span>", "The sample pitches you’ve saved in this browser."],
      inbox: ["YOUR INTRODUCTIONS", "Make room for <span>a hello.</span>", "Review introduction requests made in this browser."]
    }[state.view];
    $("#page-eyebrow").textContent = headings[0];
    $("#page-title").innerHTML = headings[1];
    $("#page-description").textContent = headings[2];
    $("#discover-controls").hidden = state.view !== "discover";
    $("#inbox-view").hidden = state.view !== "inbox";
    pitchGrid.hidden = state.view === "inbox";
    if (state.view === "inbox") renderInbox();
    else renderPitches();
  }

  function renderPitches() {
    const query = $("#search-input").value.trim().toLowerCase();
    const sector = $("#sector-filter").value;
    const stage = $("#stage-filter").value;
    const pitches = state.pitches.filter((pitch) => {
      if (state.view === "saved" && !pitch.saved) return false;
      if (state.view === "discover" && sector !== "all" && pitch.sector !== sector) return false;
      if (state.view === "discover" && stage !== "all" && pitch.stage !== stage) return false;
      return `${pitch.name} ${pitch.sector} ${pitch.location} ${pitch.description}`.toLowerCase().includes(query);
    });
    pitchGrid.innerHTML = pitches.map((pitch) => {
      const pending = introStatus(pitch);
      const requested = pending !== undefined;
      const actionLabel = pending?.status === "accepted" ? "Introduction accepted" : requested ? "Request sent" : "Request introduction";
      const name = escapeHtml(pitch.name);
      const safeSector = escapeHtml(pitch.sector.toLowerCase());
      return `<article class="pitch-card">
        <div class="card-art ${safeSector}"><span class="stage-chip">${escapeHtml(pitch.stage)}</span><span class="art-shape">${escapeHtml(pitch.sector.slice(0, 2).toUpperCase())}</span></div>
        <div class="card-body">
          <div class="card-meta"><span class="sector-label">${escapeHtml(pitch.sector)}</span><span>Sample pitch</span></div>
          <h2>${name}</h2><p class="location">⌖ ${escapeHtml(pitch.location)}</p>
          <p class="description">${escapeHtml(pitch.description)}</p>
          <div class="card-actions">
            <button class="save-button ${pitch.saved ? "saved" : ""}" data-action="save" data-id="${escapeHtml(pitch.id)}" aria-label="${pitch.saved ? "Remove from saved" : "Save pitch"}">${pitch.saved ? "♥" : "♡"}</button>
            ${state.role === "investor" ? `<button class="intro-button ${requested ? "requested" : ""}" data-action="intro" data-id="${escapeHtml(pitch.id)}" ${requested ? "disabled" : ""}>${actionLabel}</button>` : ""}
          </div>
        </div>
      </article>`;
    }).join("");
    const empty = pitches.length === 0;
    emptyState.hidden = !empty;
    $("#empty-title").textContent = state.view === "saved" ? "Nothing saved yet" : "No pitches found";
    $("#empty-description").textContent = state.view === "saved" ? "Save a sample pitch to keep it on your shortlist." : "Try changing your search or filters.";
    if (state.role === "founder" && state.view === "discover") $("#empty-description").textContent = "Create a sample pitch to add it to this browser’s demo.";
    pitchGrid.querySelectorAll("[data-action='save']").forEach((button) => button.addEventListener("click", () => toggleSaved(button.dataset.id)));
    pitchGrid.querySelectorAll("[data-action='intro']").forEach((button) => button.addEventListener("click", () => requestIntro(button.dataset.id)));
  }

  function renderInbox() {
    const requests = state.pitches.flatMap((pitch) => pitch.intros.map((intro) => ({ ...intro, pitchName: pitch.name, pitchId: pitch.id })));
    if (requests.length === 0) {
      requestList.innerHTML = `<div class="empty-inbox">No sample requests yet. Switch to investor mode and try requesting an introduction.</div>`;
      return;
    }
    requestList.innerHTML = requests.map((request) => `<article class="request-card">
      <span class="request-avatar">${escapeHtml(request.name.slice(0, 1).toUpperCase())}</span>
      <div class="request-content"><strong>${escapeHtml(request.name)} is interested in ${escapeHtml(request.pitchName)}</strong><p>A sample introduction request created in this browser.</p></div>
      <span class="request-status ${request.status}">${escapeHtml(request.status)}</span>
      ${request.status === "pending" ? `<div class="request-actions"><button class="accept-button" data-decision="accepted" data-pitch="${escapeHtml(request.pitchId)}" data-intro="${escapeHtml(request.id)}">Accept</button><button data-decision="declined" data-pitch="${escapeHtml(request.pitchId)}" data-intro="${escapeHtml(request.id)}">Decline</button></div>` : ""}
    </article>`).join("");
    requestList.querySelectorAll("[data-decision]").forEach((button) => button.addEventListener("click", () => decideIntro(button.dataset.pitch, button.dataset.intro, button.dataset.decision)));
  }

  function toggleSaved(id) {
    const pitch = state.pitches.find((item) => item.id === id);
    if (!pitch) return;
    pitch.saved = !pitch.saved;
    persist();
    updateHeader();
  }

  function requestIntro(id) {
    const pitch = state.pitches.find((item) => item.id === id);
    if (!pitch || introStatus(pitch)) return;
    pitch.intros.push({ id: `intro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: "Demo investor", status: "pending" });
    persist();
    updateHeader();
  }

  function decideIntro(pitchId, introId, status) {
    const pitch = state.pitches.find((item) => item.id === pitchId);
    const intro = pitch?.intros.find((item) => item.id === introId);
    if (!intro || !["accepted", "declined"].includes(status)) return;
    intro.status = status;
    persist();
    updateHeader();
  }

  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => {
    state.view = button.dataset.view;
    persist();
    updateHeader();
  }));
  $("#role-toggle").addEventListener("click", () => {
    state.role = state.role === "investor" ? "founder" : "investor";
    persist();
    updateHeader();
  });
  $("#mobile-role-toggle").addEventListener("click", () => {
    state.role = state.role === "investor" ? "founder" : "investor";
    persist();
    updateHeader();
  });
  $("#search-input").addEventListener("input", renderPitches);
  $("#sector-filter").addEventListener("change", renderPitches);
  $("#stage-filter").addEventListener("change", renderPitches);
  $("#dismiss-notice").addEventListener("click", () => {
    state.noticeDismissed = true;
    persist();
    updateHeader();
  });
  $("#reset-demo").addEventListener("click", () => {
    if (!confirm("Reset all demo changes saved in this browser?")) return;
    state = initialState();
    $("#search-input").value = "";
    $("#sector-filter").value = "all";
    $("#stage-filter").value = "all";
    persist();
    updateHeader();
  });
  const dialog = $("#pitch-dialog");
  $("#create-pitch").addEventListener("click", () => dialog.showModal());
  $("#close-dialog").addEventListener("click", () => dialog.close());
  $("#cancel-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  const accountDialog = $("#account-dialog");
  const accountForm = $("#account-form");
  $("#account-action").addEventListener("click", () => {
    accountForm.elements.displayName.value = state.profileName;
    accountForm.elements.role.value = state.role;
    accountDialog.showModal();
  });
  $("#close-account-dialog").addEventListener("click", () => accountDialog.close());
  $("#cancel-account-dialog").addEventListener("click", () => accountDialog.close());
  accountDialog.addEventListener("click", (event) => {
    if (event.target === accountDialog) accountDialog.close();
  });
  accountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(accountForm);
    const displayName = String(form.get("displayName") || "").trim();
    const role = String(form.get("role") || "");
    if (!displayName || !["founder", "investor"].includes(role)) return;
    state.profileName = displayName.slice(0, 50);
    state.role = role;
    persist();
    accountDialog.close();
    updateHeader();
  });
  $("#pitch-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    if (!name || !description) return;
    state.pitches.unshift({
      id: `pitch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.slice(0, 60),
      sector: String(form.get("sector")),
      stage: String(form.get("stage")),
      location: String(form.get("location") || "Location not shared").trim().slice(0, 60),
      description: description.slice(0, 180),
      saved: false,
      intros: []
    });
    state.view = "discover";
    event.currentTarget.reset();
    dialog.close();
    persist();
    updateHeader();
  });

  updateHeader();
})();
