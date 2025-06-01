const firebaseConfig = {
  apiKey: "AIzaSyB7Id_8R-XtzrQ6tPkQ8FjjXi9sbPmboqI",
  authDomain: "to-do-list-cc091.firebaseapp.com",
  projectId: "to-do-list-cc091",
  storageBucket: "to-do-list-cc091.firebasestorage.app",
  messagingSenderId: "813168809993",
  appId: "1:813168809993:web:e945f037d4f854480780d8",
  measurementId: "G-WRD47M1X2M"
};

// Підключаємо Firebase-інстанс
firebase.initializeApp(firebaseConfig);

// Використовуємо модуль Auth і Firestore у Compat-режимі
const auth = firebase.auth();
const db = firebase.firestore();

// DOM-елементи
const usersListEl = document.getElementById("users-list");
const logoutBtn = document.getElementById("logout-btn");

const editModal = document.getElementById("edit-tasks-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const tasksModalList = document.getElementById("tasks-modal-list");

// ЦЕ ІДЕНТИФІКАТОР КОРИСТУВАЧА, ЯКОГО МИ РЕДАГУЄМО У МОДАЛЦІ (браузимо натисканням “Редагувати”)
// Буде встановлюватися перед відкриттям модалки
let currentEditUserId = null;

// =================================================================
//  A) Кнопка ВИЙТИ (розлогінити та відправити на auth.html)
// =================================================================
logoutBtn.addEventListener("click", () => {
  auth.signOut()
    .then(() => {
      // Після успішного signOut — відправити на сторінку логіну/реєстрації
      window.location.href = "auth.html";
    })
    .catch((err) => {
      console.error("Помилка при виході:", err);
    });
});

// =================================================================
//  B) Коли сторінка завантажилася, перевіряємо, чи адміністратор у сесії
// =================================================================
auth.onAuthStateChanged((user) => {
  if (!user) {
    // Якщо ніхто не залогінений — відправити на auth.html
    window.location.href = "auth.html";
    return;
  }
  // Якщо зайшов звичайний користувач (не наш admin4102) — теж не дозволити
  const email = user.email;
  // Адмінська адреса: admin4102@todo.com (ми використовуємо саме цю)
  if (email !== "admin4102@todo.com") {
    // Розлогінити і запершити
    auth.signOut().then(() => {
      window.location.href = "auth.html";
    });
    return;
  }

  // Якщо це наш адмін — показати список користувачів
  loadAllUsers();
});

// =================================================================
//  C) Завантажити ВСІХ користувачів із Firestore (колекція "users")
//     і відмалювати їх у <ul id="users-list"> …
// =================================================================
function loadAllUsers() {
  // Очистити на випадок попередніх даних
  usersListEl.innerHTML = "";

  db.collection("users")
    .orderBy("username") // сортування за іменем (необов’язково, але красивіше)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        // Нема жодного користувача в базі
        const li = document.createElement("li");
        li.textContent = "Немає користувачів";
        li.classList.add("no-users");
        usersListEl.appendChild(li);
        return;
      }

      snapshot.forEach((doc) => {
        const userData = doc.data();
        const uid = doc.id;
        const username = userData.username || "—";
        const email = userData.email || `${username}@todo.com`;

        // Створити <li> для користувача
        const li = document.createElement("li");
        li.classList.add("user-item");
        li.setAttribute("data-uid", uid);

        // 1) Блок з інформацією
        const infoDiv = document.createElement("div");
        infoDiv.classList.add("user-info");
        infoDiv.textContent = `${username} (${email})`;

        // 2) Блок із кнопками дій
        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("user-actions");

        // Кнопка "Редагувати"
        const editBtn = document.createElement("button");
        editBtn.textContent = "Редагувати";
        editBtn.classList.add("edit-user-btn");
        // Передаємо uid у кнопку-натискання
        editBtn.addEventListener("click", () => {
          openEditModal(uid, username);
        });

        // Кнопка "Видалити"
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Видалити";
        deleteBtn.classList.add("delete-user-btn");
        deleteBtn.addEventListener("click", () => {
          if (confirm(`Видалити користувача "${username}"?`)) {
            deleteUser(uid);
          }
        });

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);
        usersListEl.appendChild(li);
      });
    })
    .catch((err) => {
      console.error("Помилка завантаження користувачів:", err);
      usersListEl.innerHTML = "";
      const li = document.createElement("li");
      li.textContent = "Помилка завантаження";
      li.classList.add("error-users");
      usersListEl.appendChild(li);
    });
}

// =================================================================
//  D) Видалити користувача (Firebase Auth та Firestore запис)
// =================================================================
function deleteUser(uid) {

  db.collection("users")
    .doc(uid)
    .delete()
    .then(() => {
      // Після видалення з Firestore переотримуємо список
      loadAllUsers();
    })
    .catch((err) => {
      console.error("Помилка при видаленні користувача:", err);
      alert("Не вдалося видалити користувача.");
    });
}

// =================================================================
//  E) Відкрити Модалку "Редагувати завдання" для обраного користувача
// =================================================================
function openEditModal(uid, username) {
  currentEditUserId = uid;
  // Очистити поточний список завдань у модалці
  tasksModalList.innerHTML = "";

  db.collection("tasks")
    .where("uid", "==", uid)
    .orderBy("createdAt", "asc") // якщо є поле createdAt
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        const p = document.createElement("p");
        p.textContent = "У цього користувача ще немає завдань.";
        tasksModalList.appendChild(p);
      } else {
        snapshot.forEach((doc) => {
          const taskData = doc.data();
          const taskId = doc.id;
          const text = taskData.text || "";
          const completed = taskData.completed || false;
          const priority = taskData.priority || "low";

          // Створюємо блок для кожного завдання
          const taskDiv = document.createElement("div");
          taskDiv.classList.add("task-item");
          taskDiv.setAttribute("data-task-id", taskId);

          // 1) Круговий колір відповідно до пріоритету
          const colorDot = document.createElement("span");
          colorDot.classList.add("priority-dot");
          // Додаємо клас залежно від priority
          colorDot.classList.add(`priority-${priority}`);

          // 2) Поле тексту завдання (input), спочатку readonly
          const textInput = document.createElement("input");
          textInput.type = "text";
          textInput.value = text;
          textInput.readOnly = true;
          textInput.classList.add("task-text-input");
          if (completed) {
            textInput.classList.add("task-completed");
          }

          // 3) Чекбокс "Виконано"
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = completed;
          checkbox.classList.add("task-complete-checkbox");
          checkbox.addEventListener("change", () => {
            updateTaskCompletion(taskId, checkbox.checked);
            if (checkbox.checked) {
              textInput.classList.add("task-completed");
            } else {
              textInput.classList.remove("task-completed");
            }
          });

          // 4) Стрілка для редагування тексту (виконується inline)
          const editTextBtn = document.createElement("button");
          editTextBtn.textContent = "✏️";
          editTextBtn.classList.add("task-edit-text-btn");
          editTextBtn.addEventListener("click", () => {
            if (textInput.readOnly) {
              textInput.readOnly = false;
              textInput.focus();
            }
          });

          // 5) Кнопка "Зберегти" (спочатку прихована)
          const saveTextBtn = document.createElement("button");
          saveTextBtn.textContent = "Зберегти";
          saveTextBtn.classList.add("task-save-text-btn");
          saveTextBtn.style.display = "none";
          saveTextBtn.addEventListener("click", () => {
            const newText = textInput.value.trim();
            if (newText === "") {
              alert("Текст не може бути пустим.");
              return;
            }
            updateTaskText(taskId, newText);
            textInput.readOnly = true;
            saveTextBtn.style.display = "none";
            editTextBtn.style.display = "inline-block";
          });

          // 6) Кнопка "Видалити" (червона)
          const deleteTaskBtn = document.createElement("button");
          deleteTaskBtn.textContent = "Видалити";
          deleteTaskBtn.classList.add("task-delete-btn");
          deleteTaskBtn.addEventListener("click", () => {
            if (confirm("Видалити це завдання?")) {
              deleteTask(taskId, () => {
                // Після видалення просто видаляємо блок із HTML
                taskDiv.remove();
              });
            }
          });

          // Коли користувач змінює focus з текстового поля — показати “Зберегти”, сховати “✏️”
          textInput.addEventListener("input", () => {
            if (!textInput.readOnly) {
              saveTextBtn.style.display = "inline-block";
              editTextBtn.style.display = "none";
            }
          });

          // Складаємо усі елементи у один блок
          taskDiv.appendChild(colorDot);
          taskDiv.appendChild(checkbox);
          taskDiv.appendChild(textInput);
          taskDiv.appendChild(editTextBtn);
          taskDiv.appendChild(saveTextBtn);
          taskDiv.appendChild(deleteTaskBtn);

          tasksModalList.appendChild(taskDiv);
        });
      }

      // Відкриваємо (показуємо) модалку
      editModal.style.display = "flex";
    })
    .catch((err) => {
      console.error("Помилка завантаження завдань:", err);
      tasksModalList.innerHTML = "<p>Не вдалося завантажити завдання.</p>";
      editModal.style.display = "flex";
    });
}

// =================================================================
//  F) Закрити Модалку
// =================================================================
closeModalBtn.addEventListener("click", () => {
  editModal.style.display = "none";
  tasksModalList.innerHTML = "";
  currentEditUserId = null;
});

// =================================================================
//  G) Оновити “виконаність” завдання (completed) у Firestore
// =================================================================
function updateTaskCompletion(taskId, isCompleted) {
  db.collection("tasks")
    .doc(taskId)
    .update({ completed: isCompleted })
    .catch((err) => {
      console.error("Помилка при оновленні статусу виконання:", err);
      alert("Не вдалось змінити статус.");
    });
}

// =================================================================
//  H) Оновити ТЕКСТ завдання у Firestore
// =================================================================
function updateTaskText(taskId, newText) {
  db.collection("tasks")
    .doc(taskId)
    .update({ text: newText })
    .catch((err) => {
      console.error("Помилка при оновленні тексту завдання:", err);
      alert("Не вдалось зберегти текст.");
    });
}

// =================================================================
//  I) Видалити завдання з Firestore
// =================================================================
function deleteTask(taskId, callback) {
  db.collection("tasks")
    .doc(taskId)
    .delete()
    .then(() => {
      if (typeof callback === "function") callback();
    })
    .catch((err) => {
      console.error("Помилка при видаленні завдання:", err);
      alert("Не вдалося видалити завдання.");
    });
}
