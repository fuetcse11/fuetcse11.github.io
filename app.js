// ============================================================
// Main app logic. You normally shouldn't need to edit this file.
//
// The site is split into 3 "pages" using the URL hash:
//   #/                          -> Home (all semesters)
//   #/semester/<semIndex>       -> All courses in that semester
//   #/course/<semIndex>/<name>  -> Files for that course
// This makes the browser Back button work, and each page has its own
// shareable link.
// ============================================================

const DRIVE_FILES_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";

let isAdmin = false;
let accessToken = null; // OAuth token for Drive write access
let folderCache = {};   // path -> folderId cache, to avoid repeated lookups
let pendingUpload = null; // { semester, course, category }

// ---------------- Hash routing ----------------

function navigateTo(hash) {
  if (location.hash === hash) {
    renderFromHash(); // force a re-render even if the hash didn't change
  } else {
    location.hash = hash;
  }
}

function renderFromHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter((p) => p.length > 0);

  if (parts[0] === "semester" && parts[1] !== undefined) {
    const semIndex = parseInt(parts[1], 10);
    if (!CONFIG.SEMESTERS[semIndex]) { showHomeView(); return; }

    if (parts[2] !== undefined) {
      const courseName = decodeURIComponent(parts[2]);
      if (!CONFIG.SEMESTERS[semIndex].courses.includes(courseName)) { showSemesterView(semIndex); return; }
      showCourseDetailView(semIndex, courseName);
    } else {
      showSemesterView(semIndex);
    }
  } else {
    showHomeView();
  }
}

// ---------------- Page 1: Home ----------------

function showHomeView() {
  document.getElementById("home-view").classList.remove("hidden");
  document.getElementById("semester-view").classList.add("hidden");
  document.getElementById("course-detail").classList.add("hidden");
  renderHomeView();
}

function renderHomeView() {
  const grid = document.getElementById("semester-grid");
  grid.innerHTML = "";

  if (!CONFIG.SEMESTERS.length) {
    grid.innerHTML = `<p class="empty-note">No semesters added yet.</p>`;
    return;
  }

  CONFIG.SEMESTERS.forEach((sem, i) => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `<h3>${sem.name}</h3>`;
    card.onclick = () => navigateTo(`#/semester/${i}`);
    grid.appendChild(card);
  });
}

// ---------------- Page 2: Courses in a semester ----------------

function showSemesterView(semIndex) {
  document.getElementById("home-view").classList.add("hidden");
  document.getElementById("semester-view").classList.remove("hidden");
  document.getElementById("course-detail").classList.add("hidden");
  renderSemesterView(semIndex);
}

function renderSemesterView(semIndex) {
  const sem = CONFIG.SEMESTERS[semIndex];
  document.getElementById("semester-view-name").textContent = sem.name;

  const grid = document.getElementById("course-grid-inner");
  grid.innerHTML = "";

  if (!sem.courses.length) {
    grid.innerHTML = `<p class="empty-note">No courses added to this semester yet. Add them in config.js.</p>`;
    return;
  }

  sem.courses.forEach((courseName) => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.innerHTML = `<h3>${courseName}</h3>`;
    card.onclick = () => navigateTo(`#/semester/${semIndex}/${encodeURIComponent(courseName)}`);
    grid.appendChild(card);
  });
}

// ---------------- Page 3: Files inside a course ----------------

function showCourseDetailView(semIndex, courseName) {
  document.getElementById("home-view").classList.add("hidden");
  document.getElementById("semester-view").classList.add("hidden");
  document.getElementById("course-detail").classList.remove("hidden");
  renderCourseDetailView(semIndex, courseName);
}

function renderCourseDetailView(semIndex, courseName) {
  const semesterName = CONFIG.SEMESTERS[semIndex].name;

  document.getElementById("detail-course-name").textContent = courseName;
  document.getElementById("detail-semester-name").textContent = semesterName;
  document.getElementById("back-to-semester").onclick = () => navigateTo(`#/semester/${semIndex}`);

  const cols = document.getElementById("category-columns");
  cols.innerHTML = "";

  CONFIG.CATEGORIES.forEach((category) => {
    const col = document.createElement("div");
    col.className = "category-col";
    col.innerHTML = `<h4>${category}</h4><div class="file-list" data-loading>Loading...</div>`;
    if (isAdmin) {
      const btn = document.createElement("button");
      btn.className = "add-file-btn";
      btn.textContent = "+ Add New File";
      btn.onclick = () => openUploadModal(semesterName, courseName, category);
      col.appendChild(btn);
    }
    cols.appendChild(col);

    loadFileList(semesterName, courseName, category, col.querySelector(".file-list"));
  });
}

const LINKS_FILE_NAME = "_links.json";

function renderFileList(container, items) {
  if (!items.length) {
    container.innerHTML = `<p class="detail-sub" style="margin:0;">No files yet</p>`;
    return;
  }
  container.innerHTML = "";
  items.forEach((f) => {
    const row = document.createElement("div");
    row.className = "file-row";
    row.innerHTML = `<a href="${f.url}" target="_blank" rel="noopener">${f.name}</a>`;
    container.appendChild(row);
  });
}

// Finds the _links.json file inside a folder (if any) and returns its id + parsed contents.
async function getLinksFile(folderId) {
  const q = encodeURIComponent(`name='${LINKS_FILE_NAME}' and '${folderId}' in parents and trashed=false`);
  const url = `${DRIVE_FILES_API}?q=${q}&fields=files(id)&key=${CONFIG.API_KEY}`;
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!data.files || !data.files.length) return { id: null, links: [] };

  const fileId = data.files[0].id;
  try {
    const contentRes = await fetch(`${DRIVE_FILES_API}/${fileId}?alt=media&key=${CONFIG.API_KEY}`, { headers });
    const links = await contentRes.json();
    return { id: fileId, links: Array.isArray(links) ? links : [] };
  } catch (e) {
    return { id: fileId, links: [] };
  }
}

// Creates or updates the _links.json file inside a folder with the given array of {name, url}.
async function saveLinksFile(folderId, existingFileId, links) {
  const blob = new Blob([JSON.stringify(links)], { type: "application/json" });

  if (existingFileId) {
    await fetch(`${DRIVE_UPLOAD_API}/${existingFileId}?uploadType=media`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: blob,
    });
    return existingFileId;
  }

  const metadata = { name: LINKS_FILE_NAME, parents: [folderId], mimeType: "application/json" };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", blob);
  const res = await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const data = await res.json();

  // Make the registry file publicly readable so visitors without a token can load it
  await fetch(`${DRIVE_FILES_API}/${data.id}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });

  return data.id;
}

// ---------------- Drive: find / create folders ----------------

async function findFolder(name, parentId) {
  const q = encodeURIComponent(`name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const url = `${DRIVE_FILES_API}?q=${q}&fields=files(id,name)&key=${CONFIG.API_KEY}`;
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (data.files && data.files.length) return data.files[0].id;
  return null;
}

async function createFolder(name, parentId) {
  const res = await fetch(`${DRIVE_FILES_API}?fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  const data = await res.json();
  return data.id;
}

async function resolveFolderPath(pathParts, createIfMissing) {
  const cacheKey = pathParts.join("/");
  if (folderCache[cacheKey]) return folderCache[cacheKey];

  let parentId = CONFIG.ROOT_FOLDER_ID;
  let builtPath = "";
  for (const part of pathParts) {
    builtPath += "/" + part;
    if (folderCache[builtPath]) {
      parentId = folderCache[builtPath];
      continue;
    }
    let id = await findFolder(part, parentId);
    if (!id) {
      if (!createIfMissing) return null;
      id = await createFolder(part, parentId);
    }
    folderCache[builtPath] = id;
    parentId = id;
  }
  return parentId;
}

async function loadFileList(semesterName, courseName, category, container) {
  try {
    const folderId = await resolveFolderPath([semesterName, courseName, category], false);
    if (!folderId) {
      renderFileList(container, []);
      return;
    }

    // Files placed directly in the Drive folder (auto-detected), skipping our internal registry file
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and name != '${LINKS_FILE_NAME}'`);
    const url = `${DRIVE_FILES_API}?q=${q}&fields=files(id,name,createdTime)&orderBy=createdTime&key=${CONFIG.API_KEY}`;
    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
    const res = await fetch(url, { headers });
    const data = await res.json();
    const driveFiles = (data.files || []).map((f) => ({
      name: f.name,
      url: `https://drive.google.com/file/d/${f.id}/view`,
    }));

    // Manually added links (e.g. someone else's Drive link)
    const { links } = await getLinksFile(folderId);

    renderFileList(container, [...driveFiles, ...links]);
  } catch (e) {
    console.error("loadFileList failed for", semesterName, courseName, category, e);
    container.innerHTML = `<p class="detail-sub" style="margin:0;">Could not load files</p>`;
  }
}

// ---------------- Add file (as a Google Drive link) ----------------

function openUploadModal(semester, course, category) {
  pendingUpload = { semester, course, category };
  document.getElementById("upload-target-label").textContent = `${semester} → ${course} → ${category}`;
  document.getElementById("upload-filename").value = "";
  document.getElementById("upload-file-input").value = "";
  document.getElementById("upload-link-input").value = "";
  document.getElementById("upload-progress").textContent = "";
  document.getElementById("upload-modal").classList.remove("hidden");
}

function closeUploadModal() {
  document.getElementById("upload-modal").classList.add("hidden");
  pendingUpload = null;
}

async function confirmUpload() {
  const displayName = document.getElementById("upload-filename").value.trim();
  const file = document.getElementById("upload-file-input").files[0];
  const linkUrl = document.getElementById("upload-link-input").value.trim();
  const progress = document.getElementById("upload-progress");

  if (!displayName) { progress.textContent = "Please enter a file name."; return; }
  if (!file && !linkUrl) { progress.textContent = "Either choose a PDF to upload, or paste a link."; return; }
  if (file && linkUrl) { progress.textContent = "Please use only one: upload a file OR paste a link, not both."; return; }
  if (!accessToken) { progress.textContent = "Click 'Connect Drive' above, then try again."; return; }

  progress.textContent = "Preparing folder...";
  const { semester, course, category } = pendingUpload;
  const folderId = await resolveFolderPath([semester, course, category], true);

  try {
    if (file) {
      progress.textContent = "Uploading...";
      const metadata = {
        name: displayName.endsWith(".pdf") ? displayName : displayName + ".pdf",
        parents: [folderId],
      };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      const res = await fetch(`${DRIVE_UPLOAD_API}?uploadType=multipart&fields=id`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const data = await res.json();
      if (!data.id) throw new Error("upload failed");

      // Make the uploaded file publicly viewable
      await fetch(`${DRIVE_FILES_API}/${data.id}/permissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      });
      // No need to also record this in links.json — it will be auto-detected
      // straight from the Drive folder next time the list loads.
    } else {
      progress.textContent = "Saving link...";
      const { id: linksFileId, links } = await getLinksFile(folderId);
      links.push({ name: displayName, url: linkUrl });
      await saveLinksFile(folderId, linksFileId, links);
    }

    progress.textContent = "Done!";
    setTimeout(() => {
      closeUploadModal();
      renderFromHash(); // refresh the current course page so the new file shows up
    }, 600);
  } catch (e) {
    progress.textContent = "Something went wrong, please try again.";
  }
}

// ---------------- Google Sign-In (admin check) ----------------

function decodeJwt(token) {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}

function handleCredentialResponse(response) {
  const payload = decodeJwt(response.credential);
  if (payload.email === CONFIG.ADMIN_EMAIL) {
    isAdmin = true;
    document.getElementById("admin-status").classList.remove("hidden");
    document.getElementById("admin-name").textContent = payload.name || payload.email;
    document.getElementById("signin-box").innerHTML = "";
    renderFromHash(); // re-render the current page so the admin "Add File" button appears
  } else {
    alert("Only a specific account can sign in as admin on this site. You can still view files as a regular visitor.");
  }
}

function requestDriveAccess() {
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: "https://www.googleapis.com/auth/drive.file",
    callback: (resp) => {
      if (resp.error) {
        alert("Drive access was not granted: " + resp.error + ". Please disable your pop-up blocker and try again.");
        return;
      }
      accessToken = resp.access_token;
      const btn = document.getElementById("connect-drive-btn");
      btn.textContent = "Drive Connected ✓";
      btn.disabled = true;
      renderFromHash(); // reload the current course page so the upload button appears
    },
  });
  tokenClient.requestAccessToken();
}

function signOut() {
  isAdmin = false;
  accessToken = null;
  document.getElementById("admin-status").classList.add("hidden");
  initSignInButton();
  renderFromHash();
}

function initSignInButton() {
  google.accounts.id.initialize({
    client_id: CONFIG.CLIENT_ID,
    callback: handleCredentialResponse,
  });
  google.accounts.id.renderButton(document.getElementById("signin-box"), {
    theme: "outline",
    size: "medium",
    text: "signin",
  });
}

// ---------------- Init ----------------

window.onload = () => {
  renderFromHash();
  window.addEventListener("hashchange", renderFromHash);

  document.getElementById("back-to-home").onclick = () => navigateTo("#/");
  document.getElementById("connect-drive-btn").onclick = requestDriveAccess;
  document.getElementById("signout-btn").onclick = signOut;
  document.getElementById("upload-cancel").onclick = closeUploadModal;
  document.getElementById("upload-confirm").onclick = confirmUpload;

  // Google's script may take a moment to load
  const waitForGoogle = setInterval(() => {
    if (window.google && google.accounts) {
      clearInterval(waitForGoogle);
      initSignInButton();
    }
  }, 200);
};
