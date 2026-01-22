console.log("script.js loaded")
document.addEventListener("DOMContentLoaded", () => {
  proctorForm.style.display = "none";
  personalSection.style.display = "block";
  guidelinesPage.style.display = "none";
  proctorNamesSection.style.display = "none";
  semesterForms.innerHTML = "";
  finalActions.style.display = "none";
});

/**********************
 * AUTH & ROLE CONTROL
 **********************/
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token) {
  window.location.href = "login.html";
}

function applyRoleControl() {
  if (role === "student") {
    document.querySelectorAll("input, button").forEach(el => {
      if (el.id !== "usnInput" && el.innerText !== "Search") {
        el.disabled = true;
      }
    });
    alert("Student access: View only");
  }
}

/**********************
 * GLOBAL REFERENCES
 **********************/
const usnInput = document.getElementById("usnInput");
const proctorForm = document.getElementById("proctorForm");

const studentName = document.getElementById("studentName");
const dob = document.getElementById("dob");
const fatherName = document.getElementById("fatherName");
const motherName = document.getElementById("motherName");

let currentUSN = "";
const totalSemesters = 8;

/**********************
 * CLOUDINARY UPLOAD
 **********************/
async function uploadToCloudinary(file, folder) {
  const cloudName = "dtttifi4w";
  const uploadPreset = "proctor-diary";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();
  return data.secure_url;
}




/**********************
 * SEARCH / NEW STUDENT
 **********************/
async function searchUSN() {
  const usn = usnInput.value.trim();
  if (!usn) return alert("Enter USN");

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://localhost:5000/api/diary/${usn}`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (res.status === 404) {
      alert("No record found");
      return;
    }
    
    if (!res.ok) {
      alert("Session expired. Please login again.");
      logout();
      return;
    }    

    const data = await res.json();

    proctorForm.style.display = "block";

    /* ✅ RESET FLOW STATE */
    personalSection.style.display = "block";
    guidelinesPage.style.display = "none";
    proctorNamesSection.style.display = "none";

    /* ✅ REBUILD SEMESTERS FOR EXISTING STUDENT */
    // DO NOT regenerate if already generated
if (!document.getElementById("semester1")) {
  generateSemesters();
}

    /* ✅ NOW POPULATE SAVED DATA */
    populateForm(data);


  } catch (err) {
    console.error(err);
    alert("Error loading diary");
  }
}


function newStudent() {
  currentUSN = usnInput.value.trim();
  proctorForm.style.display = "block";

  // Show ONLY personal info
  personalSection.style.display = "block";
  guidelinesPage.style.display = "none";
  proctorNamesSection.style.display = "none";

  // Reset form fields
  studentName.value = "";
  dob.value = "";
  fatherName.value = "";
  motherName.value = "";

  // 🔥 REMOVE old semesters completely
  semesterForms.innerHTML = "";

  // Hide final buttons
  finalActions.style.display = "none";
}


/**********************
 * SEMESTER / MEETING LOGIC
 **********************/
function unlockSemester(s) {
  const semDiv = document.getElementById(`semester${s}`);
  if (!semDiv) return;

  semDiv.style.display = "block";

  // Enable first meeting
  const firstMeeting = document.getElementById(`sem${s}Meet1`);
  if (firstMeeting) firstMeeting.disabled = false;

  // ✅ SHOW SAVE BUTTON once semester starts
  const finalActions = document.getElementById("finalActions");
  if (finalActions) {
    finalActions.style.display = "block";
  }
}

function generateSemesters() {
  semesterForms.innerHTML = "";

  for (let s = 1; s <= totalSemesters; s++) {
    const div = document.createElement("div");
    div.className = "form-section";
    div.id = `semester${s}`;
    div.style.display = s === 1 ? "block" : "none";

    div.innerHTML = `
      <h3>Semester ${s}</h3>
      <div id="sem${s}Meetings"></div>

      <label>SGPA <input type="text" id="sgpa${s}" disabled></label>
      <label>Leave From <input type="date" id="leaveFrom${s}"></label>
      <label>Leave To <input type="date" id="leaveTo${s}"></label>
      <label>Medical Certificate <input type="file" accept="image/png, image/jpeg, image/jpg" id="medical${s}"></label>

      <button type="button"
        id="enableNextSem${s}"
        disabled
        onclick="enableNextSemester(${s})">
        Enable Next Semester
      </button>
    `;

    semesterForms.appendChild(div);
    generateMeetings(s);
  }

  finalActions.style.display = "block";
}


function generateMeetings(sem) {
  const div = document.getElementById(`sem${sem}Meetings`);
  div.innerHTML = ""; // IMPORTANT: reset before adding

  for (let i = 1; i <= 4; i++) {
    div.innerHTML += `
      <label>Meeting ${i} Agenda
        <input
          id="sem${sem}Meet${i}"
          ${i > 1 ? "disabled" : ""}
          oninput="unlockMeetingFields(${sem}, ${i})"
        >
      </label>

      <label>Date
        <input
          type="date"
          id="sem${sem}Date${i}"
          disabled
          oninput="unlockMeetingFields(${sem}, ${i})"
        >
      </label>

      <label>Issues
        <input
          id="sem${sem}Issues${i}"
          disabled
          oninput="unlockMeetingFields(${sem}, ${i})"
        >
      </label>

      <label>Action Taken
        <input
          id="sem${sem}Action${i}"
          disabled
          oninput="unlockMeetingFields(${sem}, ${i})"
        >
      </label>

      <hr>
    `;
  }
}


function unlockMeetingFields(sem, m) {
  const agenda = document.getElementById(`sem${sem}Meet${m}`);
  const date = document.getElementById(`sem${sem}Date${m}`);
  const issues = document.getElementById(`sem${sem}Issues${m}`);
  const action = document.getElementById(`sem${sem}Action${m}`);

  // Step 1: If agenda typed → enable other fields
  if (agenda.value.trim() !== "") {
    date.disabled = false;
    issues.disabled = false;
    action.disabled = false;
  }

  // Step 2: If ALL fields filled → unlock next meeting OR SGPA
  if (
    agenda.value.trim() !== "" &&
    date.value !== "" &&
    issues.value.trim() !== "" &&
    action.value.trim() !== ""
  ) {
    if (m < 4) {
      const nextAgenda = document.getElementById(`sem${sem}Meet${m + 1}`);
      if (nextAgenda) nextAgenda.disabled = false;
    } else {
      // Last meeting completed → enable SGPA & next semester
      document.getElementById(`sgpa${sem}`).disabled = false;
      document.getElementById(`enableNextSem${sem}`).disabled = false;
    }
  }
}


function enableNextSemester(s) {
  const next = document.getElementById(`semester${s + 1}`);
  if (next) next.style.display = "block";

  // ✅ Show Save / PDF only after Semester 1 is enabled
  finalActions.style.display = "block";
}

/**********************
 * SAVE DATA (MAIN)
 **********************/
async function saveData(btn) {
  try {
    btn.disabled = true;
    btn.innerText = "Saving...";

    // ===== EXISTING CODE (UNCHANGED) =====
    const photoInput = document.getElementById("photoUpload");
    const signInput = document.getElementById("esignUpload");

    const photoUrl = photoInput.files[0]
      ? await uploadToCloudinary(photoInput.files[0], "photos")
      : "";

    const signUrl = signInput.files[0]
      ? await uploadToCloudinary(signInput.files[0], "signatures")
      : "";

    const semesters = await collectSemesterData();

    const diaryData = {
      usn: usnInput.value,
      personalInfo: {
        name: studentName.value,
        dob: dob.value,
        father: fatherName.value,
        mother: motherName.value,
        photo: photoUrl,
        esign: signUrl
      },
      semesters,
      lastUpdatedBy: "proctor"
    };

    const res = await fetch("http://localhost:5000/api/diary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(diaryData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || "Save failed");

    alert("Diary saved successfully!");

    btn.disabled = false;
    btn.innerText = "Save";

  } catch (err) {
    console.error(err);
    alert("Error saving diary");

    btn.disabled = false;
    btn.innerText = "Save";
  }
}


/**********************
 * COLLECT SEMESTER DATA
 **********************/
async function collectSemesterData() {
  const semesters = [];

  for (let s = 1; s <= totalSemesters; s++) {
    const semDiv = document.getElementById(`semester${s}`);
    if (!semDiv || semDiv.style.display === "none") break;

    const meetings = [];

    for (let m = 1; m <= 4; m++) {
      const agenda = document.getElementById(`sem${s}Meet${m}`);
      if (!agenda || !agenda.value) continue;

      meetings.push({
        agenda: agenda.value,
        date: document.getElementById(`sem${s}Date${m}`)?.value || "",
        issues: document.getElementById(`sem${s}Issues${m}`)?.value || "",
        action: document.getElementById(`sem${s}Action${m}`)?.value || ""
      });
    }

    let medicalFile = undefined;
    const medicalInput = document.getElementById(`medical${s}`);

    if (medicalInput?.files?.[0]) {
      medicalFile = await uploadToCloudinary(
        medicalInput.files[0],
        "medical"
      );
    }

    semesters.push({
      semesterNo: s,
      meetings,
      sgpa: document.getElementById(`sgpa${s}`)?.value || "",
      leaveFrom: document.getElementById(`leaveFrom${s}`)?.value || "",
      leaveTo: document.getElementById(`leaveTo${s}`)?.value || "",
      medicalFile
    });
  }

  return semesters;
}


/**********************
 * POPULATE FORM
 **********************/
function populateForm(data) {
  // PERSONAL INFO
  studentName.value = data.personalInfo?.name || "";
  dob.value = data.personalInfo?.dob || "";
  fatherName.value = data.personalInfo?.father || "";
  motherName.value = data.personalInfo?.mother || "";

  // SEMESTERS
  if (!Array.isArray(data.semesters)) return;

  data.semesters.forEach(sem => {
    const s = sem.semesterNo;

    const semDiv = document.getElementById(`semester${s}`);
    if (!semDiv) return;
    semDiv.style.display = "block";

    // MEETINGS
    sem.meetings?.forEach((m, idx) => {
      const i = idx + 1;

      document.getElementById(`sem${s}Meet${i}`).value = m.agenda || "";
      document.getElementById(`sem${s}Date${i}`).value = m.date || "";
      document.getElementById(`sem${s}Issues${i}`).value = m.issues || "";
      document.getElementById(`sem${s}Action${i}`).value = m.action || "";

      unlockMeetingFields(s, i); // re-enable next meeting
    });

    // ===== MEDICAL CERTIFICATE LINK =====
    if (sem.medicalFile) {
      const fileInput = document.getElementById(`medical${s}`);

      let link = fileInput.parentElement.querySelector(".medical-link");

      if (!link) {
        link = document.createElement("a");
        link.className = "medical-link";
        link.style.display = "block";
        link.style.marginTop = "6px";
        fileInput.parentElement.appendChild(link);
      }

      link.href = sem.medicalFile;
      link.target = "_blank";
      link.innerText = "View uploaded medical certificate";
    }



    document.getElementById(`sgpa${s}`).value = sem.sgpa || "";
    document.getElementById(`leaveFrom${s}`).value = sem.leaveFrom || "";
    document.getElementById(`leaveTo${s}`).value = sem.leaveTo || "";
  });
}
/**********************
 * LOGOUT
 **********************/
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}


function nextToGuidelines() {
  personalSection.style.display = "none";
  guidelinesPage.style.display = "block";
}

function nextToProctorNames() {
  guidelinesPage.style.display = "none";
  proctorNamesSection.style.display = "block";

  if (proctorNamesInputs.innerHTML === "") {
    generateProctorNames();
  }
}


function generateProctorNames() {
  proctorNamesInputs.innerHTML = "";

  for (let s = 1; s <= totalSemesters; s++) {
    proctorNamesInputs.innerHTML += `
      <label>
        Semester ${s} Proctor
        <input type="text"
               id="proctorName${s}"
               ${s === 1 ? "" : "disabled"}
               oninput="unlockProctor(${s})">
      </label>
    `;
  }
}

function unlockProctor(s) {
  const current = document.getElementById(`proctorName${s}`);
  if (!current || !current.value.trim()) return;

  if (s < totalSemesters) {
    const next = document.getElementById(`proctorName${s + 1}`);
    if (next) next.disabled = false;
  }
}

function nextToSemester() {
  proctorNamesSection.style.display = "none";

  // ⛔ DO NOT regenerate if already generated
  if (document.getElementById("semester1")) return;

  generateSemesters();
}
