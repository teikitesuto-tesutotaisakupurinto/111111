const STORAGE_KEY = "digitalAttendanceBook";

const defaultData = {
  grade: "中学3年",
  className: "1組",
  students: [
    { id: 1, name: "山田太郎" },
    { id: 2, name: "佐藤花子" },
    { id: 3, name: "鈴木一郎" },
    { id: 4, name: "田中美咲" }
  ],
  attendance: {}
};

let data = loadData();

let currentDate = new Date();
currentDate.setDate(1);

let selectedStudentId = null;
let selectedDateKey = null;

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(defaultData);
  }

  return JSON.parse(saved);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function render() {
  renderHeader();
  renderDates();
  renderStudents();
}

function renderHeader() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById("monthLabel").textContent =
    `${year}年${month + 1}月`;

  document.getElementById("classInfo").textContent =
    `${data.grade} ${data.className}`;
}

function renderDates() {
  const row = document.getElementById("dateRow");

  row.innerHTML = `
    <th class="number">No.</th>
    <th class="name">生徒氏名</th>
  `;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= days; day++) {
    const th = document.createElement("th");

    th.className = "date-cell";
    th.textContent = day;
    th.dataset.day = day;

    const today = new Date();

    if (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    ) {
      th.classList.add("today");
    }

    th.addEventListener("click", () => {
      openAttendanceForDate(day);
    });

    row.appendChild(th);
  }
}

function renderStudents() {
  const tbody = document.getElementById("studentRows");

  tbody.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = new Date(year, month + 1, 0).getDate();

  data.students.forEach((student, index) => {
    const tr = document.createElement("tr");

    const number = document.createElement("td");
    number.className = "number-cell";
    number.textContent = index + 1;

    const name = document.createElement("td");
    name.className = "name-cell";
    name.textContent = student.name;

    tr.appendChild(number);
    tr.appendChild(name);

    for (let day = 1; day <= days; day++) {
      const td = document.createElement("td");
      td.className = "date-cell";

      const key = dateKey(year, month, day);
      const record = data.attendance[key]?.[student.id];

      td.innerHTML = `<span class="status">${statusMark(record)}</span>`;

      td.addEventListener("click", () => {
        openAttendance(student.id, key);
      });

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

function statusMark(status) {
  if (status === "出席") return "○";
  if (status === "欠席") return "欠";
  if (status === "遅刻") return "遅";
  if (status === "振替") return "振";

  return "";
}

function openAttendanceForDate(day) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  selectedDateKey = dateKey(year, month, day);

  const modal = document.getElementById("attendanceModal");

  document.getElementById("modalTitle").textContent =
    `${year}年${month + 1}月${day}日`;

  const container = document.getElementById("attendanceButtons");

  container.innerHTML = "";

  data.students.forEach(student => {
    const wrapper = document.createElement("div");
    wrapper.style.gridColumn = "1 / -1";

    const label = document.createElement("div");
    label.textContent = student.name;
    label.style.marginBottom = "5px";

    const buttons = document.createElement("div");
    buttons.style.display = "grid";
    buttons.style.gridTemplateColumns = "repeat(4, 1fr)";
    buttons.style.gap = "5px";

    ["出席", "欠席", "遅刻", "振替"].forEach(status => {
      const button = document.createElement("button");

      button.textContent = status;

      button.addEventListener("click", () => {
        setAttendance(student.id, selectedDateKey, status);
      });

      buttons.appendChild(button);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(buttons);

    container.appendChild(wrapper);
  });

  modal.classList.remove("hidden");
}

function openAttendance(studentId, key) {
  selectedStudentId = studentId;
  selectedDateKey = key;

  const student = data.students.find(s => s.id === studentId);

  document.getElementById("modalTitle").textContent =
    `${student.name} - ${key}`;

  const container = document.getElementById("attendanceButtons");

  container.innerHTML = "";

  ["出席", "欠席", "遅刻", "振替"].forEach(status => {
    const button = document.createElement("button");

    button.textContent = status;

    button.addEventListener("click", () => {
      setAttendance(studentId, key, status);
    });

    container.appendChild(button);
  });

  document.getElementById("attendanceModal").classList.remove("hidden");
}

function setAttendance(studentId, key, status) {
  if (!data.attendance[key]) {
    data.attendance[key] = {};
  }

  data.attendance[key][studentId] = status;

  saveData();
  render();

  document.getElementById("attendanceModal").classList.add("hidden");
}

document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  render();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  render();
});

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("attendanceModal").classList.add("hidden");
});

document.getElementById("editButton").addEventListener("click", openEdit);

document.getElementById("closeEditModal").addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
});

document.getElementById("addStudent").addEventListener("click", () => {
  const maxId = data.students.reduce(
    (max, student) => Math.max(max, student.id),
    0
  );

  data.students.push({
    id: maxId + 1,
    name: ""
  });

  renderStudentEditor();
});

function openEdit() {
  document.getElementById("gradeInput").value = data.grade;
  document.getElementById("classInput").value = data.className;

  renderStudentEditor();

  document.getElementById("editModal").classList.remove("hidden");
}

function renderStudentEditor() {
  const editor = document.getElementById("studentEditor");

  editor.innerHTML = "";

  data.students.forEach(student => {
    const row = document.createElement("div");
    row.className = "student-editor-row";

    const input = document.createElement("input");

    input.type = "text";
    input.value = student.name;

    input.addEventListener("input", () => {
      student.name = input.value;
    });

    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-student";
    deleteButton.textContent = "削除";

    deleteButton.addEventListener("click", () => {
      data.students = data.students.filter(
        item => item.id !== student.id
      );

      renderStudentEditor();
    });

    row.appendChild(input);
    row.appendChild(deleteButton);

    editor.appendChild(row);
  });
}

document.getElementById("saveSettings").addEventListener("click", () => {
  data.grade = document.getElementById("gradeInput").value;
  data.className = document.getElementById("classInput").value;

  saveData();
  render();

  document.getElementById("editModal").classList.add("hidden");
});

render();
