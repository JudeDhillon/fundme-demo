(() => {
  const STORAGE_KEY = "fundme-static-demo-v1";
  const PITCH_FIELDS = ["name", "description", "sector", "stage", "problem", "solution", "founderName", "location", "fundingGoal"];
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
  const photoPreviews = [];
  const pitchMedia = Object.create(null);
  let videoPreview = null;
  let wizardStep = 0;
  let accountMode = "create";
  let pendingPitchCreation = false;
  let toastTimer;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);

  function initialState() {
    return {
      role: "investor",
      profileName: "",
      profiles: [],
      view: "discover",
      pitchDraft: {},
      draftStep: 0,
      noticeDismissed: false,
      pitches: samplePitches.map((pitch) => ({ ...pitch, intros: [] }))
    };
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
          sector: ["Climate", "Health", "Education", "Food", "Fintech", "Other"].includes(pitch.sector) ? pitch.sector : "Other",
          stage: ["Idea", "Pre-seed", "Seed"].includes(pitch.stage) ? pitch.stage : "Idea",
          location: String(pitch.location || "Location not shared").slice(0, 60),
          description: String(pitch.description || "").slice(0, 180),
          problem: String(pitch.problem || "").slice(0, 500),
          solution: String(pitch.solution || "").slice(0, 500),
          founderName: String(pitch.founderName || "").slice(0, 60),
          fundingGoal: String(pitch.fundingGoal || "").slice(0, 20),
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
        profiles: Array.isArray(data.profiles) ? data.profiles.filter((profile) => profile && typeof profile.name === "string" && ["founder", "investor"].includes(profile.role)).map((profile) => ({
          name: profile.name.trim().slice(0, 50),
          role: profile.role
        })) : [],
        view: ["discover", "saved", "inbox"].includes(data.view) ? data.view : "discover",
        pitchDraft: data.pitchDraft && typeof data.pitchDraft === "object" ? Object.fromEntries(PITCH_FIELDS.map((field) => [field, String(data.pitchDraft[field] || "").slice(0, field === "problem" || field === "solution" ? 500 : 180)])) : {},
        draftStep: Number.isInteger(data.draftStep) && data.draftStep >= 0 && data.draftStep <= 3 ? data.draftStep : 0,
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

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3500);
  }

  function updateHeader() {
    const founder = state.role === "founder";
    $("#role-label").textContent = founder ? "Founder" : "Investor";
    $("#topbar-role").textContent = founder ? "Founder" : "Investor";
    $("#account-action-label").textContent = state.profileName ? state.profileName : "Create account";
    $("#account-avatar").textContent = state.profileName ? state.profileName.trim().slice(0, 1).toUpperCase() : "+";
    $("#account-action").setAttribute("aria-label", state.profileName ? `Demo profile: ${state.profileName}` : "Create a demo account profile");
    $("#saved-count").textContent = String(savedCount());
    $("#inbox-count").textContent = String(pendingCount());
    $("#create-pitch").hidden = state.view === "inbox";
    $("#welcome-hero").hidden = state.view !== "discover";
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
      return `${pitch.name} ${pitch.sector} ${pitch.location} ${pitch.founderName || ""} ${pitch.description} ${pitch.problem || ""} ${pitch.solution || ""}`.toLowerCase().includes(query);
    });
    pitchGrid.innerHTML = pitches.map((pitch) => {
      const pending = introStatus(pitch);
      const requested = pending !== undefined;
      const actionLabel = pending?.status === "accepted" ? "Introduction accepted" : requested ? "Request sent" : "Request introduction";
      const name = escapeHtml(pitch.name);
      const safeSector = escapeHtml((pitch.sector || "other").toLowerCase());
      const media = pitchMedia[pitch.id];
      const mediaPreview = media?.photo ? `<img class="card-photo" src="${media.photo}" alt="Photo for ${name}">` : media?.video ? `<video class="card-video" src="${media.video}" controls preload="metadata" aria-label="Pitch video for ${name}"></video>` : "";
      return `<article class="pitch-card">
        <div class="card-art ${safeSector}">${mediaPreview}<span class="stage-chip">${escapeHtml(pitch.stage)}</span><span class="art-shape">${escapeHtml(pitch.sector.slice(0, 2).toUpperCase())}</span></div>
        <div class="card-body">
          <div class="card-meta"><span class="sector-label">${escapeHtml(pitch.sector)}</span><span>${escapeHtml(pitch.stage)}</span></div>
          <h2>${name}</h2><p class="location">By ${escapeHtml(pitch.founderName || "Fund Me founder")} · ⌖ ${escapeHtml(pitch.location)}</p>
          <p class="description">${escapeHtml(pitch.description)}</p>
          <div class="card-actions">
            <button class="save-button ${pitch.saved ? "saved" : ""}" data-action="save" data-id="${escapeHtml(pitch.id)}" aria-label="${pitch.saved ? "Remove from saved" : "Save pitch"}">${pitch.saved ? "♥" : "♡"}</button>
            <button class="intro-button" data-action="details" data-id="${escapeHtml(pitch.id)}">Learn more</button>
            ${state.role === "investor" ? `<button class="contact-button ${requested ? "requested" : ""}" data-action="intro" data-id="${escapeHtml(pitch.id)}" ${requested ? "disabled" : ""}>${actionLabel}</button>` : ""}
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
    pitchGrid.querySelectorAll("[data-action='details']").forEach((button) => button.addEventListener("click", () => showPitchDetails(button.dataset.id)));
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
    pitch.intros.push({ id: `intro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: state.profileName || "Demo investor", status: "pending" });
    persist();
    updateHeader();
    showToast("Demo request sent. The founder can accept or decline it here.");
  }

  function showPitchDetails(id) {
    const pitch = state.pitches.find((item) => item.id === id);
    if (!pitch) return;
    const detailDialog = $("#details-dialog");
    const media = pitchMedia[pitch.id];
    $("#details-content").innerHTML = `
      <p class="eyebrow">${escapeHtml(pitch.sector)} · ${escapeHtml(pitch.stage)}</p>
      <h2>${escapeHtml(pitch.name)}</h2>
      <p class="details-byline">By ${escapeHtml(pitch.founderName || "Fund Me founder")} · ${escapeHtml(pitch.location)}</p>
      <p class="details-summary">${escapeHtml(pitch.description)}</p>
      <div class="details-story"><h3>The problem</h3><p>${escapeHtml(pitch.problem || "This founder is shaping a solution to a meaningful challenge.")}</p><h3>The solution</h3><p>${escapeHtml(pitch.solution || pitch.description)}</p></div>
      ${pitch.fundingGoal ? `<p class="details-goal">Funding goal · INR ${Number(pitch.fundingGoal).toLocaleString("en-IN")}</p>` : ""}
      ${media?.photo ? `<img class="details-media" src="${media.photo}" alt="Pitch photo">` : ""}
      ${media?.video ? `<video class="details-media" src="${media.video}" controls preload="metadata" aria-label="Pitch video"></video>` : ""}
      <p class="privacy-note">Contact requests are only a demo. No private contact details are shared.</p>`;
    $("#details-contact").hidden = state.role !== "investor" || Boolean(introStatus(pitch));
    $("#details-contact").textContent = "Contact founder";
    $("#details-contact").onclick = () => {
      requestIntro(id);
      detailDialog.close();
    };
    detailDialog.showModal();
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
  $("#search-input").addEventListener("input", renderPitches);
  $("#sector-filter").addEventListener("change", renderPitches);
  $("#stage-filter").addEventListener("change", renderPitches);
  $("#hero-explore").addEventListener("click", () => {
    $("#discover-controls").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#search-input").focus({ preventScroll: true });
  });
  $("#dismiss-notice").addEventListener("click", () => {
    state.noticeDismissed = true;
    persist();
    updateHeader();
  });
  $("#reset-demo").addEventListener("click", () => {
    if (!confirm("Reset this browser’s demo pitches, profile, and saved changes?")) return;
    clearMedia();
    state = initialState();
    $("#search-input").value = "";
    $("#sector-filter").value = "all";
    $("#stage-filter").value = "all";
    persist();
    updateHeader();
  });

  const dialog = $("#pitch-dialog");
  const pitchForm = $("#pitch-form");
  const wizardError = $("#wizard-error");
  const wizardTitles = ["Your startup basics", "The story behind it", "Add photos or video", "Your investor preview"];
  const wizardLabels = ["Step 1 of 4", "Step 2 of 4", "Step 3 of 4", "Step 4 of 4"];
  const photoInput = $("#photo-files");
  const videoInput = $("#video-file");

  function setWizardError(message) {
    wizardError.textContent = message;
    wizardError.hidden = !message;
  }

  function syncPitchDraft() {
    state.pitchDraft = Object.fromEntries(PITCH_FIELDS.map((field) => [field, String(pitchForm.elements[field].value || "").trim()]));
    state.draftStep = wizardStep;
    persist();
  }

  function renderPhotoPreviews() {
    const container = $("#photo-previews");
    container.replaceChildren();
    photoPreviews.forEach((item, index) => {
      const tile = document.createElement("div");
      tile.className = "media-tile";
      const image = document.createElement("img");
      image.src = item.url;
      image.alt = `Selected pitch photo ${index + 1}`;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "media-remove";
      remove.setAttribute("aria-label", `Remove photo ${item.file.name}`);
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        URL.revokeObjectURL(item.url);
        photoPreviews.splice(index, 1);
        renderPhotoPreviews();
      });
      tile.append(image, remove);
      container.append(tile);
    });
  }

  function renderVideoPreview() {
    const container = $("#video-preview");
    container.replaceChildren();
    if (!videoPreview) return;
    const video = document.createElement("video");
    video.src = videoPreview.url;
    video.controls = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", "Selected pitch video preview");
    const label = document.createElement("span");
    label.textContent = `${videoPreview.file.name} · local preview`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "media-remove";
    remove.setAttribute("aria-label", "Remove pitch video");
    remove.textContent = "Remove video";
    remove.addEventListener("click", () => {
      URL.revokeObjectURL(videoPreview.url);
      videoPreview = null;
      videoInput.value = "";
      renderVideoPreview();
    });
    container.append(video, label, remove);
  }

  function buildPitchPreview() {
    const values = Object.fromEntries(PITCH_FIELDS.map((field) => [field, String(pitchForm.elements[field].value || "").trim()]));
    const imageList = photoPreviews.length
      ? `<div class="review-photos">${photoPreviews.map((item, index) => `<img src="${item.url}" alt="Pitch photo ${index + 1}">`).join("")}</div>`
      : "";
    const video = videoPreview ? `<video class="review-video" src="${videoPreview.url}" controls preload="metadata" aria-label="Pitch video preview"></video>` : "";
    $("#pitch-preview").innerHTML = `
      ${imageList}${video}
      <p class="eyebrow">${escapeHtml(values.sector || "Category")} · ${escapeHtml(values.stage || "Stage")}</p>
      <h3>${escapeHtml(values.name || "Your startup name")}</h3>
      <p class="review-byline">By ${escapeHtml(values.founderName || "Founder")} · ${escapeHtml(values.location || "Location")}</p>
      <p class="review-description">${escapeHtml(values.description || "Your short description will appear here.")}</p>
      <div class="review-story"><h4>The problem</h4><p>${escapeHtml(values.problem || "Your problem statement will appear here.")}</p><h4>The solution</h4><p>${escapeHtml(values.solution || "Your solution will appear here.")}</p></div>
      ${values.fundingGoal ? `<p class="review-goal">Funding goal · INR ${Number(values.fundingGoal).toLocaleString("en-IN")}</p>` : ""}
      <p class="review-privacy">In this demo, your pitch is only saved in this browser. It is not public or shared with investors.</p>`;
  }

  function showWizardStep(step) {
    wizardStep = Math.max(0, Math.min(3, step));
    state.draftStep = wizardStep;
    document.querySelectorAll(".wizard-page").forEach((page) => {
      page.hidden = Number(page.dataset.step) !== wizardStep;
    });
    $("#wizard-title").textContent = wizardTitles[wizardStep];
    $("#wizard-step-name").textContent = wizardLabels[wizardStep];
    $("#wizard-progress-fill").style.width = `${((wizardStep + 1) / 4) * 100}%`;
    $("#wizard-back").hidden = wizardStep === 0;
    $("#wizard-next").hidden = wizardStep === 3;
    $("#wizard-publish").hidden = wizardStep !== 3;
    setWizardError("");
    if (wizardStep === 3) buildPitchPreview();
    persist();
  }

  function openWizard() {
    for (const field of PITCH_FIELDS) {
      pitchForm.elements[field].value = state.pitchDraft[field] || (field === "founderName" ? state.profileName : "");
    }
    renderPhotoPreviews();
    renderVideoPreview();
    showWizardStep(state.draftStep || 0);
    if (!dialog.open) dialog.showModal();
  }

  function clearMedia() {
    photoPreviews.forEach((item) => URL.revokeObjectURL(item.url));
    photoPreviews.length = 0;
    if (videoPreview) URL.revokeObjectURL(videoPreview.url);
    videoPreview = null;
    photoInput.value = "";
    videoInput.value = "";
    renderPhotoPreviews();
    renderVideoPreview();
  }

  $("#create-pitch").addEventListener("click", () => {
    if (state.profileName && state.role === "founder") {
      openWizard();
      return;
    }
    pendingPitchCreation = true;
    accountMode = "create";
    accountForm.elements.displayName.value = "";
    accountForm.elements.role.value = "founder";
    setAccountMode();
    accountDialog.showModal();
  });
  $("#close-dialog").addEventListener("click", () => dialog.close());
  $("#cancel-dialog").addEventListener("click", () => {
    syncPitchDraft();
    dialog.close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      syncPitchDraft();
      dialog.close();
    }
  });
  dialog.addEventListener("cancel", syncPitchDraft);
  pitchForm.addEventListener("input", syncPitchDraft);
  pitchForm.addEventListener("change", syncPitchDraft);
  $("#wizard-next").addEventListener("click", () => {
    const currentPage = document.querySelector(`.wizard-page[data-step="${wizardStep}"]`);
    const invalid = currentPage.querySelector(":invalid");
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    syncPitchDraft();
    showWizardStep(wizardStep + 1);
  });
  $("#wizard-back").addEventListener("click", () => {
    syncPitchDraft();
    showWizardStep(wizardStep - 1);
  });
  photoInput.addEventListener("change", () => {
    setWizardError("");
    const files = Array.from(photoInput.files || []);
    if (photoPreviews.length + files.length > 4) {
      setWizardError("Choose up to 4 photos. Remove a photo before adding another.");
      photoInput.value = "";
      return;
    }
    const invalid = files.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      setWizardError(`${invalid.name}: choose a JPG, PNG, or WebP image smaller than 5 MB.`);
      photoInput.value = "";
      return;
    }
    files.forEach((file) => photoPreviews.push({ file, url: URL.createObjectURL(file) }));
    photoInput.value = "";
    renderPhotoPreviews();
  });
  videoInput.addEventListener("change", () => {
    setWizardError("");
    const file = videoInput.files?.[0];
    if (!file) return;
    const extensionValid = /\.(mp4|webm|mov)$/i.test(file.name);
    if (!extensionValid || file.size > 100 * 1024 * 1024) {
      setWizardError(`${file.name}: choose an MP4, WebM, or MOV video smaller than 100 MB.`);
      videoInput.value = "";
      return;
    }
    if (videoPreview) URL.revokeObjectURL(videoPreview.url);
    videoPreview = { file, url: URL.createObjectURL(file) };
    renderVideoPreview();
  });

  const accountDialog = $("#account-dialog");
  const accountForm = $("#account-form");
  const accountError = $("#account-error");

  function setAccountMode() {
    document.querySelectorAll(".account-mode-button").forEach((button) => {
      const active = button.dataset.accountMode === accountMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $("#account-dialog-title").textContent = accountMode === "create" ? "Create your demo profile" : "Use a saved demo profile";
    $("#account-submit").innerHTML = accountMode === "create" ? "Create demo profile <span aria-hidden=\"true\">↗</span>" : "Continue as this profile <span aria-hidden=\"true\">→</span>";
    accountError.hidden = true;
  }

  function showAccountDialog(role = state.role, mode = "create") {
    accountForm.elements.displayName.value = state.profileName;
    accountForm.elements.role.value = role;
    pendingPitchCreation = false;
    accountMode = mode;
    setAccountMode();
    if (!accountDialog.open) accountDialog.showModal();
  }

  $("#account-action").addEventListener("click", () => showAccountDialog());
  $("#role-toggle").addEventListener("click", () => {
    const newRole = state.role === "founder" ? "investor" : "founder";
    showAccountDialog(newRole);
  });
  document.querySelectorAll(".account-mode-button").forEach((button) => button.addEventListener("click", () => {
    accountMode = button.dataset.accountMode;
    setAccountMode();
  }));
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
    if (!displayName || !["founder", "investor"].includes(role)) {
      accountError.textContent = "Enter your name and choose whether you’re joining as a founder or investor.";
      accountError.hidden = false;
      return;
    }
    const profileName = displayName.slice(0, 50);
    if (accountMode === "signin") {
      const profile = state.profiles.find((item) => item.name.toLocaleLowerCase() === profileName.toLocaleLowerCase() && item.role === role);
      if (!profile) {
        accountError.textContent = "No saved demo profile matches that name and role in this browser. Create a profile first.";
        accountError.hidden = false;
        return;
      }
      state.profileName = profile.name;
      state.role = profile.role;
    } else {
      state.profiles = state.profiles.filter((item) => !(item.name.toLocaleLowerCase() === profileName.toLocaleLowerCase() && item.role === role));
      state.profiles.push({ name: profileName, role });
      state.profileName = profileName;
      state.role = role;
    }
    persist();
    accountDialog.close();
    updateHeader();
    showToast(accountMode === "signin" ? "Demo profile selected in this browser." : "Demo profile saved in this browser.");
    if (pendingPitchCreation && state.role === "founder") {
      pendingPitchCreation = false;
      openWizard();
    } else if (pendingPitchCreation && state.role !== "founder") {
      pendingPitchCreation = false;
      accountError.textContent = "Choose the founder role to create a pitch.";
      accountError.hidden = false;
      accountDialog.showModal();
    }
  });

  $("#close-details").addEventListener("click", () => $("#details-dialog").close());
  $("#pitch-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (wizardStep !== 3) return;
    syncPitchDraft();
    const values = state.pitchDraft;
    const id = `pitch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    state.pitches.unshift({
      id,
      name: values.name.slice(0, 60),
      sector: values.sector || "Other",
      stage: values.stage,
      location: values.location.slice(0, 60),
      founderName: values.founderName.slice(0, 60),
      description: values.description.slice(0, 180),
      problem: values.problem.slice(0, 500),
      solution: values.solution.slice(0, 500),
      fundingGoal: values.fundingGoal,
      saved: false,
      intros: []
    });
    if (photoPreviews.length || videoPreview) {
      pitchMedia[id] = { photo: photoPreviews[0]?.url || "", video: videoPreview?.url || "" };
    }
    state.view = "discover";
    state.pitchDraft = {};
    state.draftStep = 0;
    pitchForm.reset();
    photoPreviews.length = 0;
    videoPreview = null;
    dialog.close();
    persist();
    updateHeader();
    showToast("Sample pitch added to this browser’s explore list.");
  });

  accountMode = "create";
  setAccountMode();
  updateHeader();
})();
