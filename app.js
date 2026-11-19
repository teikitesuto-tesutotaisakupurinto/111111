const STORAGE_KEY = "digitalAttendanceBook_v2";

const STATUS_LIST = [
  "出席",
  "欠席",
  "遅刻",
  "振替"
];

const STATUS_MARK = {
  "出席": "○",
  "欠席": "欠",
  "遅刻": "遅",
  "振替": "振"
};


const defaultData = {

  grade: "中学3年",

  className: "1組",

  students: [
    {
      id: 1,
      name: "山田太郎"
    },
    {
      id: 2,
      name: "佐藤花子"
    },
    {
      id: 3,
      name: "鈴木一郎"
    },
    {
      id: 4,
      name: "田中美咲"
    }
  ],

  /*
    attendance:

    {
      "2026-11-19": {
        "1": "出席",
        "2": "欠席",
        "3": "遅刻"
      }
    }
  */

  attendance: {}
};


let data = loadData();

let currentDate = new Date();

currentDate.setDate(1);


/*
  日付入力画面で編集中のデータ

  保存するまでは本データを変更しない。
*/
let editingAttendance = null;

let editingDateKey = null;


/* =========================
   初期化
========================= */

document.addEventListener("DOMContentLoaded", () => {

  setupEvents();

  render();

});


/* =========================
   データ
========================= */

function loadData() {

  const saved =
    localStorage.getItem(STORAGE_KEY);

  if (!saved) {

    return structuredClone(defaultData);

  }

  try {

    return JSON.parse(saved);

  } catch (error) {

    console.error(error);

    return structuredClone(defaultData);

  }

}


function saveData() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );

}


/* =========================
   イベント
========================= */

function setupEvents() {

  document
    .getElementById("prevMonth")
    .addEventListener(
      "click",
      previousMonth
    );


  document
    .getElementById("nextMonth")
    .addEventListener(
      "click",
      nextMonth
    );


  document
    .getElementById("editButton")
    .addEventListener(
      "click",
      openEditModal
    );


  document
    .getElementById("closeAttendanceModal")
    .addEventListener(
      "click",
      closeAttendanceModal
    );


  document
    .getElementById("cancelAttendance")
    .addEventListener(
      "click",
      closeAttendanceModal
    );


  document
    .getElementById("saveAttendance")
    .addEventListener(
      "click",
      saveAttendance
    );


  document
    .getElementById("allPresentButton")
    .addEventListener(
      "click",
      () => {

        setAllAttendance("出席");

      }
    );


  document
    .getElementById("allAbsentButton")
    .addEventListener(
      "click",
      () => {

        setAllAttendance("欠席");

      }
    );


  document
    .getElementById("clearAllButton")
    .addEventListener(
      "click",
      clearAllAttendance
    );


  document
    .getElementById("closeEditModal")
    .addEventListener(
      "click",
      closeEditModal
    );


  document
    .getElementById("cancelEdit")
    .addEventListener(
      "click",
      closeEditModal
    );


  document
    .getElementById("saveSettings")
    .addEventListener(
      "click",
      saveSettings
    );


  document
    .getElementById("addStudent")
    .addEventListener(
      "click",
      addStudent
    );

}


/* =========================
   メイン画面
========================= */

function render() {

  renderHeader();

  renderDateHeader();

  renderStudents();

}


function renderHeader() {

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  document
    .getElementById("monthLabel")
    .textContent =
    `${year}年${month + 1}月`;


  document
    .getElementById("classInfo")
    .textContent =
    `${data.grade}　${data.className}`;

}


/* =========================
   日付ヘッダー
========================= */

function renderDateHeader() {

  const row =
    document.getElementById("dateRow");


  row.innerHTML = "";

  const numberHeader =
    document.createElement("th");

  numberHeader.className =
    "number-column";

  numberHeader.textContent =
    "No.";

  row.appendChild(numberHeader);


  const nameHeader =
    document.createElement("th");

  nameHeader.className =
    "name-column";

  nameHeader.textContent =
    "生徒氏名";

  row.appendChild(nameHeader);


  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  for (
    let day = 1;
    day <= days;
    day++
  ) {

    const th =
      document.createElement("th");

    th.className =
      "date-cell";

    th.textContent =
      day;

    th.title =
      `${year}年${month + 1}月${day}日の出席入力`;

    if (isToday(year, month, day)) {

      th.classList.add("today");

    }


    th.addEventListener(
      "click",
      () => {

        openAttendanceModal(day);

      }
    );


    row.appendChild(th);

  }

}


/* =========================
   生徒一覧
========================= */

function renderStudents() {

  const tbody =
    document.getElementById("studentRows");


  tbody.innerHTML = "";


  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();

  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  data.students.forEach(
    (student, index) => {

      const tr =
        document.createElement("tr");


      const numberCell =
        document.createElement("td");

      numberCell.className =
        "number-cell";

      numberCell.textContent =
        index + 1;


      const nameCell =
        document.createElement("td");

      nameCell.className =
        "name-cell";

      nameCell.textContent =
        student.name;


      tr.appendChild(numberCell);

      tr.appendChild(nameCell);


      for (
        let day = 1;
        day <= days;
        day++
      ) {

        const td =
          document.createElement("td");

        td.className =
          "date-cell";


        const key =
          makeDateKey(
            year,
            month,
            day
          );


        const status =
          data.attendance[key]?.[
            student.id
          ] || "";


        const span =
          document.createElement("span");

        span.className =
          "status";

        span.textContent =
          STATUS_MARK[status] || "";


        td.appendChild(span);


        td.addEventListener(
          "click",
          () => {

            openAttendanceModal(day);

          }
        );


        tr.appendChild(td);

      }


      tbody.appendChild(tr);

    }
  );

}


/* =========================
   日付入力画面
========================= */

function openAttendanceModal(day) {

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


  editingDateKey =
    makeDateKey(
      year,
      month,
      day
    );


  /*
    現在の保存データをコピー。

    ここを編集しても、
    「保存」を押すまでは
    元データを変更しない。
  */

  editingAttendance = {};


  data.students.forEach(
    student => {

      const currentStatus =
        data.attendance[
          editingDateKey
        ]?.[student.id] || "";


      /*
        既に入力済みならその状態。

        まだ入力されていない場合は
        「未入力」。
      */

      editingAttendance[
        student.id
      ] = currentStatus;

    }
  );


  document
    .getElementById(
      "attendanceDateTitle"
    )
    .textContent =
    formatDateTitle(
      year,
      month,
      day
    );


  renderAttendanceList();


  document
    .getElementById("attendanceModal")
    .classList.remove("hidden");

}


/* =========================
   出席入力一覧
========================= */

function renderAttendanceList() {

  const container =
    document.getElementById(
      "attendanceStudentList"
    );


  container.innerHTML = "";


  data.students.forEach(
    (student, index) => {

      const row =
        document.createElement("div");

      row.className =
        "attendance-row";


      const name =
        document.createElement("div");

      name.className =
        "attendance-student-name";

      name.textContent =
        `${index + 1}. ${student.name}`;


      row.appendChild(name);


      STATUS_LIST.forEach(
        status => {

          const button =
            document.createElement("button");

          button.type =
            "button";

          button.className =
            "status-button";

          button.textContent =
            status;


          if (
            editingAttendance[
              student.id
            ] === status
          ) {

            button.classList.add(
              "selected"
            );

          }


          button.addEventListener(
            "click",
            () => {

              selectStatus(
                student.id,
                status
              );

            }
          );


          row.appendChild(button);

        }
      );


      container.appendChild(row);

    }
  );


  updateInputCount();

}


/* =========================
   出欠選択
========================= */

function selectStatus(
  studentId,
  status
) {

  /*
    ボタンを押しても
    モーダルは閉じない。

    その場で選択状態だけ変更。
  */

  editingAttendance[
    studentId
  ] = status;


  renderAttendanceList();

}


/* =========================
   全員出席
========================= */

function setAllAttendance(status) {

  data.students.forEach(
    student => {

      editingAttendance[
        student.id
      ] = status;

    }
  );


  renderAttendanceList();

}


/* =========================
   全員解除
========================= */

function clearAllAttendance() {

  data.students.forEach(
    student => {

      editingAttendance[
        student.id
      ] = "";

    }
  );


  renderAttendanceList();

}


/* =========================
   入力人数
========================= */

function updateInputCount() {

  const total =
    data.students.length;


  const entered =
    data.students.filter(
      student =>
        editingAttendance[
          student.id
        ]
    ).length;


  document
    .getElementById("inputCount")
    .textContent =
    `${entered} / ${total}人入力済み`;

}


/* =========================
   出席保存
========================= */

function saveAttendance() {

  if (!editingDateKey) {

    return;

  }


  /*
    日付の記録を作成
  */

  data.attendance[
    editingDateKey
  ] = {};


  data.students.forEach(
    student => {

      const status =
        editingAttendance[
          student.id
        ];


      if (status) {

        data.attendance[
          editingDateKey
        ][student.id] =
          status;

      }

    }
  );


  /*
    全員未入力なら
    日付データ自体を削除
  */

  if (
    Object.keys(
      data.attendance[
        editingDateKey
      ]
    ).length === 0
  ) {

    delete data.attendance[
      editingDateKey
    ];

  }


  saveData();


  render();


  closeAttendanceModal();

}


/* =========================
   出席画面を閉じる
========================= */

function closeAttendanceModal() {

  document
    .getElementById("attendanceModal")
    .classList.add("hidden");


  editingAttendance =
    null;

  editingDateKey =
    null;

}


/* =========================
   月変更
========================= */

function previousMonth() {

  currentDate.setMonth(
    currentDate.getMonth() - 1
  );

  render();

}


function nextMonth() {

  currentDate.setMonth(
    currentDate.getMonth() + 1
  );

  render();

}


/* =========================
   編集画面
========================= */

function openEditModal() {

  document
    .getElementById("gradeInput")
    .value =
    data.grade;


  document
    .getElementById("classInput")
    .value =
    data.className;


  renderStudentEditor();


  document
    .getElementById("editModal")
    .classList.remove("hidden");

}


function closeEditModal() {

  document
    .getElementById("editModal")
    .classList.add("hidden");

}


/* =========================
   生徒編集
========================= */

function renderStudentEditor() {

  const container =
    document.getElementById(
      "studentEditor"
    );


  container.innerHTML = "";


  data.students.forEach(
    student => {

      const row =
        document.createElement("div");

      row.className =
        "student-editor-row";


      const input =
        document.createElement("input");

      input.type =
        "text";

      input.value =
        student.name;

      input.placeholder =
        "生徒氏名";


      input.addEventListener(
        "input",
        event => {

          student.name =
            event.target.value;

        }
      );


      const deleteButton =
        document.createElement("button");

      deleteButton.type =
        "button";

      deleteButton.className =
        "delete-student";

      deleteButton.textContent =
        "削除";


      deleteButton.addEventListener(
        "click",
        () => {

          deleteStudent(
            student.id
          );

        }
      );


      row.appendChild(input);

      row.appendChild(
        deleteButton
      );


      container.appendChild(row);

    }
  );

}


/* =========================
   生徒追加
========================= */

function addStudent() {

  const maxId =
    data.students.reduce(
      (max, student) =>
        Math.max(
          max,
          Number(student.id)
        ),
      0
    );


  data.students.push({

    id: maxId + 1,

    name: ""

  });


  renderStudentEditor();

}


/* =========================
   生徒削除
========================= */

function deleteStudent(studentId) {

  const student =
    data.students.find(
      item =>
        item.id === studentId
    );


  if (!student) {

    return;

  }


  const confirmed =
    window.confirm(
      `${student.name || "この生徒"}を削除しますか？`
    );


  if (!confirmed) {

    return;

  }


  data.students =
    data.students.filter(
      item =>
        item.id !== studentId
    );


  /*
    過去の出席データからも
    この生徒の記録を削除する。
  */

  Object.keys(
    data.attendance
  ).forEach(
    dateKey => {

      delete data.attendance[
        dateKey
      ][studentId];


      if (
        Object.keys(
          data.attendance[
            dateKey
          ]
        ).length === 0
      ) {

        delete data.attendance[
          dateKey
        ];

      }

    }
  );


  renderStudentEditor();

}


/* =========================
   設定保存
========================= */

function saveSettings() {

  const grade =
    document
      .getElementById("gradeInput")
      .value
      .trim();


  const className =
    document
      .getElementById("classInput")
      .value
      .trim();


  data.grade =
    grade || "未設定";


  data.className =
    className || "未設定";


  /*
    空白の生徒名は
    「未登録」として扱う。
  */

  data.students.forEach(
    student => {

      student.name =
        student.name.trim() ||
        "未登録";

    }
  );


  saveData();

  render();

  closeEditModal();

}


/* =========================
   日付キー
========================= */

function makeDateKey(
  year,
  month,
  day
) {

  return [
    year,

    String(month + 1)
      .padStart(2, "0"),

    String(day)
      .padStart(2, "0")

  ].join("-");

}


/* =========================
   今日判定
========================= */

function isToday(
  year,
  month,
  day
) {

  const today =
    new Date();


  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );

}


/* =========================
   日付表示
========================= */

function formatDateTitle(
  year,
  month,
  day
) {

  const date =
    new Date(
      year,
      month,
      day
    );


  const weekdays = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土"
  ];


  return (
    `${year}年${month + 1}月${day}日` +
    `（${weekdays[date.getDay()]}）`
  );

}
