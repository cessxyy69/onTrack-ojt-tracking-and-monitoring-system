// --- SIDEBAR JS ---
document.addEventListener("DOMContentLoaded", function () {
  const openSidebarBtn = document.getElementById("openSidebar");
  const closeSidebarBtn = document.getElementById("closeSidebar");
  const sidebar = document.getElementById("sidebar");

  if (openSidebarBtn && closeSidebarBtn && sidebar) {
    openSidebarBtn.addEventListener("click", function () {
      sidebar.classList.add("active");
      openSidebarBtn.style.display = "none";
      closeSidebarBtn.style.display = "inline-block";
    });

    closeSidebarBtn.addEventListener("click", function () {
      sidebar.classList.remove("active");
      openSidebarBtn.style.display = "inline-block";
      closeSidebarBtn.style.display = "none";
    });
  }
});
// --- END SIDEBAR JS ---

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBA4IwkROlhrz2ts19gLD48Cio_D0qiqbw",
  authDomain: "ontrack-585a4.firebaseapp.com",
  projectId: "ontrack-585a4",
  storageBucket: "ontrack-585a4.firebasestorage.app",
  messagingSenderId: "799924979752",
  appId: "1:799924979752:web:8a9579035dc75ea16dcd1d",
  measurementId: "G-TBF0Y7BNDK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Global variables
let currentUser = null;
let userData = null;

// Sign out functionality with confirmation and loader
const signOutBtn = document.getElementById('signOutBtn');
const signOutConfirmationModal = document.getElementById('signOutConfirmationModal');
const confirmSignOutBtn = document.getElementById('confirmSignOut');
const cancelSignOutBtn = document.getElementById('cancelSignOut');
const signOutLoadingOverlay = document.getElementById('signOutLoadingOverlay');

if (signOutBtn) {
  signOutBtn.addEventListener('click', function() {
    // Show confirmation modal
    signOutConfirmationModal.style.display = 'flex';
  });
}

// Cancel sign out
if (cancelSignOutBtn) {
  cancelSignOutBtn.addEventListener('click', function() {
    signOutConfirmationModal.style.display = 'none';
  });
}

// Confirm sign out
if (confirmSignOutBtn) {
  confirmSignOutBtn.addEventListener('click', function() {
    // Hide confirmation modal
    signOutConfirmationModal.style.display = 'none';
    
    // Show loading overlay
    signOutLoadingOverlay.classList.add('active');
    
    // Sign out with a slight delay to show the loading animation
    setTimeout(() => {
      if (window.firebase && firebase.auth) {
        firebase.auth().signOut().then(() => {
          window.location.href = "index.html";
        }).catch((error) => {
          console.error("Error signing out:", error);
          signOutLoadingOverlay.classList.remove('active');
          // Display error message if needed
        });
      } else {
        // Fallback: just redirect
        window.location.href = "index.html";
      }
    }, 1000); // 1 second delay for visual feedback
  });
}

// Close confirmation modal if clicked outside
window.addEventListener('click', function(event) {
  if (event.target === signOutConfirmationModal) {
    signOutConfirmationModal.style.display = 'none';
  }
});


// --- Function to load user data from Firebase ---
// --- Function to load user data from Firebase ---
async function loadUserData() {
  try {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
      console.error("Firebase is not initialized");

      // Wait a moment to see if Firebase initializes (it might be loading asynchronously)
      return new Promise(resolve => {
        setTimeout(async () => {
          if (typeof firebase !== 'undefined' && firebase.apps.length) {
            // Firebase is now available, retry the function
            resolve(await loadUserData());
          } else {
            console.error("Firebase still not available after waiting");
            resolve(null);
          }
        }, 1000); // Wait 1 second before retrying
      });
    }

    // Get the current user
    const user = firebase.auth().currentUser;
    if (!user) {
      console.error("No user is signed in");
      // Wait for auth state to be initialized
      return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((authUser) => {
          unsubscribe();
          if (authUser) {
            // User is now available, call this function again
            resolve(loadUserData());
          } else {
            console.error("Still no user after auth state initialized");
            resolve(null);
          }
        });
      });
    }

    // Get the user document from Firestore
    const userDoc = await firebase.firestore().collection("users").doc(user.uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      // Format OJT period
      let startDate = new Date(userData.ojtPeriod.startDate);
      let endDate = new Date(userData.ojtPeriod.endDate);

      // Format dates for display
      const formattedStartDate = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const formattedEndDate = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Update the OJT Info section in the UI
      updateOjtInfoUI(userData, `${formattedStartDate} - ${formattedEndDate}`);

      return {
        ...userData,
        formattedPeriod: `${formattedStartDate} - ${formattedEndDate}`
      };
    } else {
      console.error("User document does not exist");
      return null;
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    return null;
  }
}

// --- Function to update the OJT Info UI ---
function updateOjtInfoUI(userData, formattedPeriod) {
  // Update the OJT Info section in the UI
  const ojtInfoSection = document.querySelector('.ojt-info-container');
  if (ojtInfoSection) {
    ojtInfoSection.innerHTML = `
      <div class="ojt-info-row">
        <div class="ojt-info-col">
          <h3>Student Name</h3>
          <p>${userData.fullName || 'Not provided'}</p>
        </div>
        <div class="ojt-info-col">
          <h3>Student ID</h3>
          <p>${userData.studentID || 'Not provided'}</p>
        </div>
      </div>
      <div class="ojt-info-row">
        <div class="ojt-info-col">
          <h3>Course</h3>
          <p>${userData.course || 'Not provided'}</p>
        </div>
        <div class="ojt-info-col">
          <h3>Company</h3>
          <p>${userData.company || 'Not provided'}</p>
        </div>
      </div>
      <div class="ojt-info-row">
        <div class="ojt-info-col">
          <h3>OJT Adviser</h3>
          <p>${userData.ojtAdviser || 'Not provided'}</p>
        </div>
        <div class="ojt-info-col">
          <h3>OJT Period</h3>
          <p>${formattedPeriod || 'Not provided'}</p>
        </div>
      </div>
    `;
  }
}

// --- Helper: Format time to 12-hour format ---
function formatTime12hr(timeString) {
  try {
    if (!timeString) return "";
    const time = new Date(`2000-01-01T${timeString}`);
    if (isNaN(time.getTime())) return timeString;
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return timeString;
  }
}

// --- Function to update the reports table, filters, and pagination ---
function updateReportsTable(page = 1) {
  const reports = JSON.parse(localStorage.getItem("generatedReports") || "[]");
  const tbody = document.getElementById("reports-table-body");
  const filterType = document.getElementById("filter-type");
  const sortBy = document.getElementById("sort-by");
  const searchInput = document.getElementById("search-reports");
  const paginationDiv = document.getElementById("reports-pagination");

  // --- Update filter options based on available report types ---
  if (filterType) {
    const types = Array.from(new Set(reports.map((r) => r.type))).filter(
      Boolean
    );
    const current = filterType.value;
    filterType.innerHTML = `<option value="all">All Types</option>`;
    types.forEach((type) => {
      filterType.innerHTML += `<option value="${type}">${type}</option>`;
    });
    // Restore selection if possible
    if ([...filterType.options].some((opt) => opt.value === current)) {
      filterType.value = current;
    }
  }

  // --- Filtering, Sorting, Searching ---
  let filteredReports = [...reports];

  // Filter by type
  const selectedType = filterType ? filterType.value : "all";
  if (selectedType !== "all") {
    filteredReports = filteredReports.filter((r) => r.type === selectedType);
  }

  // Search
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
  if (searchTerm) {
    filteredReports = filteredReports.filter(
      (r) =>
        (r.title && r.title.toLowerCase().includes(searchTerm)) ||
        (r.type && r.type.toLowerCase().includes(searchTerm))
    );
  }

  // Sort
  if (sortBy) {
    switch (sortBy.value) {
      case "date-desc":
        filteredReports.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "date-asc":
        filteredReports.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "name-asc":
        filteredReports.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        );
        break;
      case "name-desc":
        filteredReports.sort((a, b) =>
          (b.title || "").localeCompare(a.title || "")
        );
        break;
      default:
        break;
    }
  }

  // --- Pagination ---
  const reportsPerPage = 5;
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage) || 1;
  page = Math.max(1, Math.min(page, totalPages));
  const startIdx = (page - 1) * reportsPerPage;
  const endIdx = startIdx + reportsPerPage;
  const paginatedReports = filteredReports.slice(startIdx, endIdx);

  // --- Render table ---
  if (!tbody) return;
  tbody.innerHTML = "";
  if (paginatedReports.length === 0) {
    tbody.innerHTML = `<tr>
        <td colspan="4" class="no-records">
          No reports found. Generate a report to get started.
        </td>
      </tr>`;
  } else {
    paginatedReports.forEach((report) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${report.title}</td>
          <td>${report.type}</td>
          <td>${report.date}</td>
          <td>${report.status}</td>
        `;
      tbody.appendChild(tr);
    });
  }

  // --- Render pagination ---
  if (paginationDiv) {
    paginationDiv.innerHTML = "";
    if (totalPages > 1) {
      // Prev button
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "Prev";
      prevBtn.disabled = page === 1;
      prevBtn.onclick = () => updateReportsTable(page - 1);
      paginationDiv.appendChild(prevBtn);

      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === page) btn.classList.add("active");
        btn.onclick = () => updateReportsTable(i);
        paginationDiv.appendChild(btn);
      }

      // Next button
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.disabled = page === totalPages;
      nextBtn.onclick = () => updateReportsTable(page + 1);
      paginationDiv.appendChild(nextBtn);
    }
  }
}

// --- Time Log Report Generation ---
document.addEventListener("DOMContentLoaded", async function () {
  // Load user data when page loads
  const userData = await loadUserData();

  // Modal open/close
  const timeLogModal = document.getElementById("time-log-modal");
  const timeLogForm = timeLogModal
    ? timeLogModal.querySelector(".modal-form")
    : null;
  const timeLogCancelBtn = timeLogModal
    ? timeLogModal.querySelector(".cancel-button")
    : null;
  const timeLogCloseBtn = timeLogModal
    ? timeLogModal.querySelector(".close-modal")
    : null;

  // Open modal on card click
  const timeLogCard = document.querySelector(
    '.report-type-card[data-report-type="time-log"]'
  );
  if (timeLogCard && timeLogModal) {
    timeLogCard.addEventListener("click", function () {
      timeLogModal.classList.add("active");
    });
  }
  // Close modal
  function closeTimeLogModal() {
    timeLogModal.classList.remove("active");
  }
  if (timeLogCancelBtn) timeLogCancelBtn.onclick = closeTimeLogModal;
  if (timeLogCloseBtn) timeLogCloseBtn.onclick = closeTimeLogModal;
  if (timeLogModal) {
    timeLogModal.addEventListener("click", function (e) {
      if (e.target === timeLogModal) closeTimeLogModal();
    });
  }

  // PDF Generation
  if (timeLogForm) {
    timeLogForm.onsubmit = async function (e) {
      e.preventDefault();

      // Try to get fresh user data, or use the data we already loaded
      const currentUserData = await loadUserData() || userData;

      if (!currentUserData) {
        alert("Could not load user data. Please try again or log out and log back in.");
        return;
      }

      // OJT info from the user's profile data
      const ojtInfo = {
        name: currentUserData.fullName || "Not provided",
        id: currentUserData.studentID || "Not provided",
        course: currentUserData.course || "Not provided",
        company: currentUserData.company || "Not provided",
        supervisor: currentUserData.ojtAdviser || "Not provided",
        period: currentUserData.formattedPeriod || "Not provided",
      };

      // Get date range
      const startDate = document.getElementById("time-log-start").value;
      const endDate = document.getElementById("time-log-end").value;

      // Get activity logs from localStorage
      let logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
      // Filter logs by date range
      const filteredLogs = logs.filter((log) => {
        return log.date >= startDate && log.date <= endDate;
      });

      // Calculate total hours
      let totalHours = 0;
      filteredLogs.forEach((log) => {
        totalHours += Number(log.hours || 0);
      });

      // Generate PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("landscape");

      // Header
      doc.setFontSize(20);
      doc.text("OJT Time Log Report", 15, 15);

      // OJT Info
      doc.setFontSize(11);
      let y = 22;
      doc.text(`Name: ${ojtInfo.name}`, 15, y);
      doc.text(`Student ID: ${ojtInfo.id}`, 80, y);
      doc.text(`Course: ${ojtInfo.course}`, 150, y);
      y += 7;
      doc.text(`Company: ${ojtInfo.company}`, 15, y);
      doc.text(`Supervisor: ${ojtInfo.supervisor}`, 80, y);
      doc.text(`OJT Period: ${ojtInfo.period}`, 150, y);
      y += 10;

      // Date range
      doc.setFontSize(10);
      doc.text(`Report Period: ${startDate} to ${endDate}`, 15, y);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        150,
        y
      );
      y += 7;

      // Table data
      const tableData = filteredLogs.map((log) => {
        const dateObj = new Date(log.date);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const timeIn = formatTime12hr(log.timeIn);
        const timeOut = formatTime12hr(log.timeOut);
        return [
          formattedDate,
          `${timeIn} - ${timeOut}`,
          log.hours,
          log.activities || "",
          log.status
            ? log.status.charAt(0).toUpperCase() + log.status.slice(1)
            : "",
        ];
      });

      // Summary section
      doc.setFontSize(10);
      doc.text(`Total Entries: ${filteredLogs.length}`, 15, y + 7);
      doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 80, y + 7);
      const approvedEntries = filteredLogs.filter(
        (log) => log.status === "approved"
      ).length;
      doc.text(`Approved Entries: ${approvedEntries}`, 145, y + 7);

      // Table
      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          startY: y + 14,
          head: [["Date", "Time", "Hours", "Activities", "Status"]],
          body: tableData,
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 20 },
            3: { cellWidth: 120 },
            4: { cellWidth: 25 },
          },
          headStyles: {
            fillColor: [46, 101, 243],
            textColor: 255,
            fontSize: 10,
            fontStyle: "bold",
          },
          didDrawPage: function (data) {
            doc.setFontSize(8);
            doc.text(
              "OnTrack - OJT Monitoring System",
              doc.internal.pageSize.getWidth() / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: "center" }
            );
          },
        });
      }

      // Save the PDF
      const filename = `OJT_Time_Log_Report_${startDate}_to_${endDate}.pdf`;
      doc.save(filename);

      // --- Save report info to localStorage ---
      const reports = JSON.parse(
        localStorage.getItem("generatedReports") || "[]"
      );
      const now = new Date();
      reports.push({
        title: `Time Log Report (${startDate} to ${endDate})`,
        type: "Time Log",
        date: now.toLocaleDateString(),
        status: "Generated",
        fileName: filename,
      });
      localStorage.setItem("generatedReports", JSON.stringify(reports));

      // --- Update the reports table in the UI ---
      updateReportsTable();

      // Close the modal after generation
      closeTimeLogModal();
    };
  }

  // --- Summary Report Generation ---
  const summaryModal = document.getElementById("summary-modal");
  const summaryForm = summaryModal
    ? summaryModal.querySelector(".modal-form")
    : null;
  const summaryCancelBtn = summaryModal
    ? summaryModal.querySelector(".cancel-button")
    : null;
  const summaryCloseBtn = summaryModal
    ? summaryModal.querySelector(".close-modal")
    : null;

  // Open modal on card click
  const summaryCard = document.querySelector(
    '.report-type-card[data-report-type="summary"]'
  );
  if (summaryCard && summaryModal) {
    summaryCard.addEventListener("click", function () {
      summaryModal.classList.add("active");
    });
  }
  // Close modal
  function closeSummaryModal() {
    summaryModal.classList.remove("active");
  }
  if (summaryCancelBtn) summaryCancelBtn.onclick = closeSummaryModal;
  if (summaryCloseBtn) summaryCloseBtn.onclick = closeSummaryModal;
  if (summaryModal) {
    summaryModal.addEventListener("click", function (e) {
      if (e.target === summaryModal) closeSummaryModal();
    });
  }

  // PDF Generation for Summary
  if (summaryForm) {
    summaryForm.onsubmit = async function (e) {
      e.preventDefault();

      // Try to get fresh user data, or use the data we already loaded
      const currentUserData = await loadUserData() || userData;

      if (!currentUserData) {
        alert("Could not load user data. Please try again or log out and log back in.");
        return;
      }

      // OJT info from the user's profile data
      const ojtInfo = {
        name: currentUserData.fullName || "Not provided",
        id: currentUserData.studentID || "Not provided",
        course: currentUserData.course || "Not provided",
        company: currentUserData.company || "Not provided",
        supervisor: currentUserData.ojtAdviser || "Not provided",
        period: currentUserData.formattedPeriod || "Not provided",
      };

      // Get required hours from user data or localStorage
      let requiredHours = parseInt(currentUserData.requiredHours, 10) || 486;
      if (isNaN(requiredHours) && localStorage.getItem("requiredHours")) {
        requiredHours = parseInt(localStorage.getItem("requiredHours"), 10);
      }

      // Get all activity logs
      let logs = JSON.parse(localStorage.getItem("activityLogs")) || [];
      logs.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate completed OJT hours (exclude rejected logs)
      let completedHours = 0;
      logs.forEach((log) => {
        if (log.status && log.status.toLowerCase() !== "rejected") {
          completedHours += parseFloat(log.hours);
        }
      });

      // Get all tasks
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
      tasks = tasks.filter((t) => !t.archived);

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (t) => t.status === "Completed"
      ).length;
      const pendingTasks = tasks.filter(
        (t) => t.status === "Pending" || t.status === "Not Started"
      ).length;

      // Overdue: due date before today and not completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueTasks = tasks.filter((t) => {
        const due = new Date(t.dueDate);
        return due < today && t.status !== "Completed";
      }).length;

      // Prepare tasks table data
      const tasksTableData = tasks.map((task) => {
        const dueDate = new Date(task.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return [task.title, dueDate, task.status];
      });

      // Prepare time logs table data
      const logsTableData = logs.map((log) => {
        const date = new Date(log.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const timeIn = formatTime12hr(log.timeIn);
        const timeOut = formatTime12hr(log.timeOut);
        return [
          date,
          `${timeIn} - ${timeOut}`,
          log.hours,
          log.activities || "",
          log.status
            ? log.status.charAt(0).toUpperCase() + log.status.slice(1)
            : "",
        ];
      });

      // Generate PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF("landscape");

      // Header
      doc.setFontSize(20);
      doc.text("OJT Summary Report", 15, 15);

      // OJT Info
      doc.setFontSize(11);
      let y = 22;
      doc.text(`Name: ${ojtInfo.name}`, 15, y);
      doc.text(`Student ID: ${ojtInfo.id}`, 80, y);
      doc.text(`Course: ${ojtInfo.course}`, 150, y);
      y += 7;
      doc.text(`Company: ${ojtInfo.company}`, 15, y);
      doc.text(`Supervisor: ${ojtInfo.supervisor}`, 80, y);
      doc.text(`OJT Period: ${ojtInfo.period}`, 150, y);
      y += 10;

      // Summary Section
      doc.setFontSize(12);
      doc.text(`Completed OJT Hours: ${completedHours.toFixed(1)}`, 15, y);
      doc.text(`Required Hours: ${requiredHours}`, 80, y);
      y += 7;
      doc.text(`Total No. of Tasks: ${totalTasks}`, 15, y);
      doc.text(`No. of Completed Tasks: ${completedTasks}`, 80, y);
      doc.text(`No. of Pending Tasks: ${pendingTasks}`, 150, y);
      y += 7;
      doc.text(`No. of Overdue Tasks: ${overdueTasks}`, 15, y);
      y += 10;

      // Tasks Table
      doc.setFontSize(13);
      doc.text("Tasks Overview", 15, y);
      y += 5;
      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          startY: y + 2,
          head: [["Task Name", "Due Date", "Status"]],
          body: tasksTableData,
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
          },
          headStyles: {
            fillColor: [46, 101, 243],
            textColor: 255,
            fontSize: 10,
            fontStyle: "bold",
          },
          didDrawPage: function (data) {
            doc.setFontSize(8);
            doc.text(
              "OnTrack - OJT Monitoring System",
              doc.internal.pageSize.getWidth() / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: "center" }
            );
          },
        });
        y = doc.lastAutoTable.finalY + 10;
      }

      // Time Logs Table
      doc.setFontSize(13);
      doc.text("Time Logs", 15, y);
      y += 5;
      if (typeof doc.autoTable === "function") {
        doc.autoTable({
          startY: y + 2,
          head: [["Date", "Time", "Hours", "Activities", "Status"]],
          body: logsTableData,
          theme: "grid",
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 20 },
            3: { cellWidth: 120 },
            4: { cellWidth: 25 },
          },
          headStyles: {
            fillColor: [46, 101, 243],
            textColor: 255,
            fontSize: 10,
            fontStyle: "bold",
          },
          didDrawPage: function (data) {
            doc.setFontSize(8);
            doc.text(
              "OnTrack - OJT Monitoring System",
              doc.internal.pageSize.getWidth() / 2,
              doc.internal.pageSize.getHeight() - 10,
              { align: "center" }
            );
          },
        });
      }

      // Save the PDF
      const filename = `OJT_Summary_Report_${new Date().toISOString().split("T")[0]
        }.pdf`;
      doc.save(filename);

      // --- Save report info to localStorage ---
      const reports = JSON.parse(
        localStorage.getItem("generatedReports") || "[]"
      );
      const now = new Date();
      reports.push({
        title: `Summary Report (${now.toLocaleDateString()})`,
        type: "Summary",
        date: now.toLocaleDateString(),
        status: "Generated",
        fileName: filename,
      });
      localStorage.setItem("generatedReports", JSON.stringify(reports));

      // --- Update the reports table in the UI ---
      updateReportsTable();

      // Close the modal after generation
      closeSummaryModal();
    };
  }

  // --- Initial table load ---
  updateReportsTable();

  // --- Filter, Sort, and Search listeners ---
  const filterType = document.getElementById("filter-type");
  const sortBy = document.getElementById("sort-by");
  const searchInput = document.getElementById("search-reports");

  if (filterType) {
    filterType.addEventListener("change", () => updateReportsTable(1));
  }
  if (sortBy) {
    sortBy.addEventListener("change", () => updateReportsTable(1));
  }
  if (searchInput) {
    searchInput.addEventListener("input", () => updateReportsTable(1));
  }

  // Download button handler (placeholder)
  document
    .getElementById("reports-table-body")
    ?.addEventListener("click", function (e) {
      if (e.target.classList.contains("download-report-btn")) {
        alert("Please re-generate the report to download.");
      }
    });
});