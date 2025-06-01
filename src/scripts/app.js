// 1) Firebase-ініціалізація (Compat)
const firebaseConfig = {
  apiKey: "AIzaSyB7Id_8R-XtzrQ6tPkQ8FjjXi9sbPmboqI",
  authDomain: "to-do-list-cc091.firebaseapp.com",
  projectId: "to-do-list-cc091",
  storageBucket: "to-do-list-cc091.firebasestorage.app",
  messagingSenderId: "813168809993",
  appId: "1:813168809993:web:e945f037d4f854480780d8",
  measurementId: "G-WRD47M1X2M"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// 2) DOM-елементи
const authBtn = document.getElementById("auth-btn");
const newTaskInput = document.getElementById("new-task-input");
const prioritySelect = document.getElementById("priority-select");
const addTaskBtn = document.getElementById("add-task-btn");

const filterAllBtn = document.getElementById("filter-all");
const filterActiveBtn = document.getElementById("filter-active");
const filterCompletedBtn = document.getElementById("filter-completed");

const tasksListEl = document.getElementById("tasks-list");

// 3) Змінні стану
let currentUser = null;
let allTasks = [];       // масив об’єктів { id, text, completed, priority }

// Поточний фільтр: "all", "active", "completed"
let currentFilter = "all";

// =====================================================
// A) Обробник авторизації/розлогінення
// =====================================================

// Коли змінюється стан авторизації
auth.onAuthStateChanged((user) => {
  if (user) {
    // Якщо залогінений
    currentUser = user;
    authBtn.textContent = "Вийти";
    authBtn.onclick = () => {
      auth.signOut().then(() => {
        window.location.href = "auth.html";
      });
    };
    // Завантажити і відмалювати завдання
    loadTasksFromFirestore();
  } else {
    // Якщо не залогінений
    currentUser = null;
    authBtn.textContent = "Увійти";
    authBtn.onclick = () => {
      window.location.href = "auth.html";
    };
    // Очищаємо список
    allTasks = [];
    renderTasks();
  }
});

// =====================================================
// B) Завантаження завдань із Firestore для поточного користувача
// =====================================================
function loadTasksFromFirestore() {
  if (!currentUser) return;
  // Очистити масив
  allTasks = [];

  db.collection("tasks")
    .where("uid", "==", currentUser.uid)
    .orderBy("createdAt", "asc")
    .get()
    .then((snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        allTasks.push({
          id: doc.id,
          text: data.text,
          completed: data.completed,
          priority: data.priority
        });
      });
      renderTasks();
    })
    .catch((err) => {
      console.error("Помилка завантаження завдань:", err);
    });
}

// =====================================================
// C) Рендеринг списку завдань (з урахуванням фільтру)
// =====================================================
function renderTasks() {
  tasksListEl.innerHTML = "";

  // Відфільтрувати tasks згідно currentFilter
  let tasksToShow = [];
  if (currentFilter === "all") {
    tasksToShow = allTasks.slice();
  } else if (currentFilter === "active") {
    tasksToShow = allTasks.filter((t) => !t.completed);
  } else if (currentFilter === "completed") {
    tasksToShow = allTasks.filter((t) => t.completed);
  }

  if (tasksToShow.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Немає завдань";
    li.classList.add("no-tasks");
    tasksListEl.appendChild(li);
    return;
  }

  tasksToShow.forEach((task) => {
    const li = document.createElement("li");
    li.classList.add("task-item");
    li.setAttribute("data-id", task.id);

    // — Крапка пріоритету
    const dot = document.createElement("span");
    dot.classList.add("priority-dot", `priority-${task.priority}`);

    // — Чекбокс виконано
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.classList.add("task-checkbox");
    checkbox.addEventListener("change", () => {
      toggleTaskCompleted(task.id, checkbox.checked);
    });

    // — Текст завдання (readonly, доки не натиснуте “Редагувати”)
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = task.text;
    textInput.readOnly = true;
    textInput.classList.add("task-text");
    if (task.completed) {
      textInput.classList.add("task-completed");
    }

    // — Кнопка “Редагувати”
    const editBtn = document.createElement("button");
    editBtn.textContent = "Редагувати";
    editBtn.classList.add("btn", "btn-edit");
    editBtn.addEventListener("click", () => {
      enableTaskEditing(task.id, textInput, editBtn, saveBtn);
    });

    // — Кнопка “Зберегти” (спочатку прихована)
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Зберегти";
    saveBtn.classList.add("btn", "btn-save");
    saveBtn.style.display = "none";
    saveBtn.addEventListener("click", () => {
      saveTaskText(task.id, textInput.value.trim(), textInput, editBtn, saveBtn);
    });

    // — Кнопка “Видалити”
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Видалити";
    deleteBtn.classList.add("btn", "btn-delete");
    deleteBtn.addEventListener("click", () => {
      if (confirm("Видалити це завдання?")) {
        deleteTask(task.id);
      }
    });

    li.appendChild(dot);
    li.appendChild(checkbox);
    li.appendChild(textInput);
    li.appendChild(editBtn);
    li.appendChild(saveBtn);
    li.appendChild(deleteBtn);

    tasksListEl.appendChild(li);
  });
}

// =====================================================
// D) Перемикання фільтрів
// =====================================================
filterAllBtn.addEventListener("click", () => {
  currentFilter = "all";
  setActiveFilterButton(filterAllBtn);
  renderTasks();
});
filterActiveBtn.addEventListener("click", () => {
  currentFilter = "active";
  setActiveFilterButton(filterActiveBtn);
  renderTasks();
});
filterCompletedBtn.addEventListener("click", () => {
  currentFilter = "completed";
  setActiveFilterButton(filterCompletedBtn);
  renderTasks();
});

function setActiveFilterButton(activeBtn) {
  // Вилучаємо клас з усіх, додаємо тільки до clicked
  [filterAllBtn, filterActiveBtn, filterCompletedBtn].forEach((btn) => {
    btn.classList.remove("btn-active");
  });
  activeBtn.classList.add("btn-active");
}

// =====================================================
// E) Додавання нового завдання
// =====================================================
addTaskBtn.addEventListener("click", () => {
  const text = newTaskInput.value.trim();
  const priority = prioritySelect.value;

  if (!currentUser) {
    alert("Будь ласка, спочатку увійдіть.");
    return;
  }
  if (text === "") {
    alert("Текст не може бути пустим.");
    return;
  }

  // Формуємо об'єкт нового завдання
  const newTask = {
    uid: currentUser.uid,
    text: text,
    completed: false,
    priority: priority,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("tasks")
    .add(newTask)
    .then((docRef) => {
      // Додаємо локально в масив у кінець
      allTasks.push({
        id: docRef.id,
        text: text,
        completed: false,
        priority: priority
      });
      // Очищаємо поле і оновлюємо список
      newTaskInput.value = "";
      prioritySelect.value = "low";
      renderTasks();
    })
    .catch((err) => {
      console.error("Помилка додавання завдання:", err);
      alert("Не вдалося додати завдання.");
    });
});

// =====================================================
// F) При натисканні Enter у полі введення — додати те ж саме
// =====================================================
newTaskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTaskBtn.click();
  }
});

// =====================================================
// G) Перемикання виконаності завдання (toggle completed)
// =====================================================
function toggleTaskCompleted(taskId, isCompleted) {
  // Оновлюємо у Firestore
  db.collection("tasks")
    .doc(taskId)
    .update({ completed: isCompleted })
    .then(() => {
      // Оновлюємо локально allTasks
      allTasks = allTasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, completed: isCompleted };
        }
        return t;
      });
      renderTasks();
    })
    .catch((err) => {
      console.error("Помилка оновлення виконаності:", err);
      alert("Не вдалося оновити статус виконання.");
    });
}

// =====================================================
// H) Редагування тексту завдання (перемикаємо в режим редагування)
// =====================================================
function enableTaskEditing(taskId, textInput, editBtn, saveBtn) {
  textInput.readOnly = false;
  textInput.focus();
  editBtn.style.display = "none";
  saveBtn.style.display = "inline-block";
}

// =====================================================
// I) Збереження нового тексту завдання
// =====================================================
function saveTaskText(taskId, newText, textInput, editBtn, saveBtn) {
  if (newText === "") {
    alert("Текст не може бути пустим.");
    return;
  }
  // Оновлюємо у Firestore
  db.collection("tasks")
    .doc(taskId)
    .update({ text: newText })
    .then(() => {
      // Оновлюємо локально
      allTasks = allTasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, text: newText };
        }
        return t;
      });
      textInput.readOnly = true;
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
      renderTasks();
    })
    .catch((err) => {
      console.error("Помилка збереження тексту:", err);
      alert("Не вдалося зберегти текст.");
    });
}

// =====================================================
// J) Видалення завдання
// =====================================================
function deleteTask(taskId) {
  db.collection("tasks")
    .doc(taskId)
    .delete()
    .then(() => {
      // Оновлюємо локально
      allTasks = allTasks.filter((t) => t.id !== taskId);
      renderTasks();
    })
    .catch((err) => {
      console.error("Помилка видалення завдання:", err);
      alert("Не вдалося видалити завдання.");
    });
}

// =====================================================
// K) При завантаженні сторінки: якщо зайшли зразу, форма одразу готова
// Просто лишаємо код вище, нічого додаткового не треба.
// =====================================================

