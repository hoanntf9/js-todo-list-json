const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Lấy các phần tử từ HTML
const addBtn = $(".add-btn");
const formAdd = $("#addTaskModal");
const formDelete = $("#deleteTaskModal");
const modalClose = $(".modal-close");
const btnCancel = $(".btn-cancel");
const btnDeleteCancel = $(".btn-delete-cancel");
const modalDeleteClose = $(".modal-delete-close");
const deleteTaskSubmit = $("#deleteTaskSubmit.btn-danger");
const todoForm = $(".todo-app-form");
const titleInput = $("#taskTitle");
const todoList = $("#todoList");
const searchInput = $(".search-input");
const activeTabBtn = $(".active-tab");
const completedTabBtn = $(".completed-btn");
const allTabBtn = $(".all-tab");
const tabs = $(".tabs");

const TAB_KEYS = {
    activeTab: "active-tab",
    completedTab: "completed-tab"
};

let todoTasks = [];

const http_methods = {
    get: "GET",
    post: "POST",
    put: "PUT",
    delete: "DELETE",
    patch: "PATCH"
};

const httpJsonHeaders = {
    "Content-Type": "application/json"
};

const apiBase = "http://localhost:4000/tasks";

document.addEventListener("DOMContentLoaded", async function () {
    todoTasks = await getAllTasks();

    // Lấy activeTab từ localStorage
    const activeTab = localStorage.getItem("activeTab") || TAB_KEYS.activeTab;

    // Bỏ class active khỏi các tab
    $$(".tab-button").forEach(tab => tab.classList.remove("active"));

    // Tìm đúng tab đang lưu và set class active
    const currentTab = $(`.tab-button[data-tab="${activeTab}"]`);

    if (currentTab) {
        currentTab.classList.add("active");
    }

    // Hiển thị danh sách task khi trang web tải xong
    switch (activeTab) {

        case TAB_KEYS.activeTab:
            const activeTasks = todoTasks?.filter(task => !task.isCompleted);
            renderTasks(activeTasks);

            break;

        case TAB_KEYS.completedTab:
            const completedTabs = todoTasks?.filter(task => task.isCompleted);
            renderTasks(completedTabs);
            break;

        default:
            renderTasks(todoTasks);
            break;
    }
});

// Hàm xóa dấu tiếng việt để tìm kiếm
function removeVietnameseTones(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .trim();
}

// Khi người dùng gõ vào ô tìm kiếm
searchInput.oninput = function (event) {
    const keyword = removeVietnameseTones(event.target.value);

    // Chuyển về tab 'Active' khi tìm kiếm
    $$(".tab-button").forEach((tab) => tab.classList.remove("active"));
    $(`.tab-button[data-tab="${TAB_KEYS.activeTab}"]`).classList.add("active");

    const filteredTasks = todoTasks.filter(task => {
        const title = removeVietnameseTones(task.title);
        const description = removeVietnameseTones(task.description);

        return title.includes(keyword) || description.includes(keyword);
    });

    if (!filteredTasks.length) {
        setHTML("#todoList", "<p>Không tìm thấy</p>");
        return;
    }

    renderTasks(filteredTasks);
};

// Biến để theo dõi đang sửa task nào (null = không sửa)
let editIndex = null;

// Biến để theo dõi đang xóa task nào (null = không xóa)
let deleteIndex = null;

// Hàm đóng form thêm/sửa task
function closeForm() {
    // Ẩn form
    formAdd.className = "modal-overlay";

    // Đổi lại tiêu đề form về ban đầu
    const formTitle = formAdd.querySelector(".modal-title");
    if (formTitle) {
        formTitle.textContent =
            formTitle.dataset.original || formTitle.textContent;
        delete formTitle.dataset.original;
    }

    // Đổi lại text nút submit về ban đầu
    const submitBtn = formAdd.querySelector(".btn-submit");
    if (submitBtn) {
        submitBtn.textContent =
            submitBtn.dataset.original || submitBtn.textContent;
        delete submitBtn.dataset.original;
    }

    // Cuộn form lên đầu
    setTimeout(() => {
        formAdd.querySelector(".modal").scrollTop = 0;
    }, 300);

    // Xóa hết dữ liệu trong form
    todoForm.reset();

    // Đặt lại trạng thái không sửa task nào
    editIndex = null;
}

function closeFormDelete() {
    // Ẩn form delete
    formDelete.className = "modal-overlay";
}

// Hàm mở form thêm/sửa task
function openFormModal() {
    formAdd.className = "modal-overlay show";
    setTimeout(() => titleInput.focus(), 100);
}

// Hàm mở form confirm xác nhận xóa
function openFormDeleteModal(task, taskIndex) {
    formDelete.className = "modal-overlay show";

    const messageDelete = formDelete.querySelector('.delete-message');
    messageDelete.innerHTML = `Are you sure delete task <span class="delete-title">${task?.title}?</span>`;

    deleteIndex = taskIndex;
}

// Khi nhấn nút "Thêm mới"
addBtn.onclick = openFormModal;
// addBtn.onclick = openFormDeleteModal;

// Khi nhấn nút đóng form
modalClose.onclick = closeForm;
btnCancel.onclick = closeForm;

// Khi nhấn nút đóng form `delete`
btnDeleteCancel.onclick = closeFormDelete;
modalDeleteClose.onclick = closeFormDelete;

// `getAllTasks`
async function getAllTasks() {
    try {
        const res = await fetch(apiBase);
        const tasks = await res.json();
        return tasks;
    } catch (error) {
        console.log("Error when fetch task: ", error);
    }
}

// `getTaskDetail`
async function getTaskDetail(id) {
    try {
        const res = await fetch(`${apiBase}/${id}`);
        const task = await res.json();
        return task;
    } catch (error) {
        console.log("Error get task detail");
    }
}

// `createTask`
async function createTask(task) {
    const res = await fetch(apiBase, {
        method: http_methods.post,
        headers: httpJsonHeaders,
        body: JSON.stringify(task)
    });
    return res.json();
}

// `updateTask`
async function updateTask(id, task) {
    const res = await fetch(`${apiBase}/${id}`, {
        method: http_methods.put,
        headers: httpJsonHeaders,
        body: JSON.stringify(task)
    });
    return res.json();
}

// `deleteTask`.
async function deleteTask(id) {
    return await fetch(`${apiBase}/${id}`, {
        method: http_methods.delete
    });
}

// `toggleCompleteTask`
async function toggleCompleteTask(id, isCompleted) {
    return await fetch(`${apiBase}/${id}`, {
        method: http_methods.patch,
        headers: httpJsonHeaders,
        body: JSON.stringify({ isCompleted })
    });
}

// Hàm check trùng tiêu đề
function checkTitleDuplicate(title, taskIndex) {
    const normalizedTitle = removeVietnameseTones(title);

    return todoTasks?.some((task, index) => {
        if (taskIndex !== null && index === taskIndex) return false;
        return removeVietnameseTones(task.title) === normalizedTitle;
    });
}

// Khi gửi form (thêm mới hoặc sửa task)
todoForm.onsubmit = async (event) => {
    event.preventDefault();
    // Lấy dữ liệu từ form
    const formData = Object.fromEntries(new FormData(todoForm));
    const isDuplicateTitle = checkTitleDuplicate(formData.title, editIndex);

    if (isDuplicateTitle) {
        showToast({
            text: "Task title is duplicated!",
            backgroundColor: "#dc3545",
        });
        return;
    }

    // Check trùng tiêu đề khi tạo và khi xóa
    // Nếu đang sửa task
    if (editIndex) {
        // todoTasks[editIndex] = formData;
        await updateTask(editIndex, formData);

        // Thông báo khi đã sửa thành công
        showToast({
            text: "Edit task successfully!",
            backgroundColor: "#0d6efd",
        });
    }
    // Nếu đang thêm task mới
    else {
        // Đánh dấu task chưa hoàn thành
        formData.isCompleted = false;

        // Thêm task mới vào đầu danh sách
        await createTask(formData);

        // Thông báo khi đã tạo thành công
        showToast({
            text: "Create task successfully!",
            backgroundColor: "#62ac89",
        });
    }

    // Đóng form
    closeForm();

    // Hiển thị lại danh sách task
    const activeTab = localStorage.getItem(TAB_KEYS.activeTab);
    getTasksByTab(activeTab);

    // renderTasks(tasks);
};

// Hàm lưu trạng thái tab đang chọn
function saveTabActive(tab = TAB_KEYS.activeTab) {
    localStorage.setItem("activeTab", tab);
}

// Xử lý khi nhấn các nút trong danh sách task
todoList.onclick = async function (event) {
    const editBtn = event.target.closest(".edit-btn");
    const deleteBtn = event.target.closest(".delete-btn");
    const completeBtn = event.target.closest(".complete-btn");

    // Nếu nhấn nút sửa
    if (editBtn) {
        const taskIndex = editBtn.dataset.index;

        const task = await getTaskDetail(taskIndex);


        // Đánh dấu đang sửa task này
        editIndex = taskIndex;

        // Điền thông tin task vào form
        for (const key in task) {
            const value = task[key];
            const input = $(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        }

        // Đổi tiêu đề form thành "Edit Task"
        const formTitle = formAdd.querySelector(".modal-title");
        if (formTitle) {
            formTitle.dataset.original = formTitle.textContent;
            formTitle.textContent = "Edit Task";
        }

        // Đổi text nút submit thành "Save Task"
        const submitBtn = formAdd.querySelector(".btn-submit");
        if (submitBtn) {
            submitBtn.dataset.original = submitBtn.textContent;
            submitBtn.textContent = "Save Task";
        }

        // Mở form
        openFormModal();
    }

    // Nếu nhấn nút xóa
    if (deleteBtn) {
        const taskIndex = deleteBtn.dataset.index;

        // const task = todoTasks[taskIndex];
        const task = await getTaskDetail(taskIndex);

        // Hiển thị modal xác nhận trước khi xóa
        openFormDeleteModal(task, taskIndex);
    }

    // Nếu nhấn nút hoàn thành/chưa hoàn thành
    if (completeBtn) {
        const taskIndex = completeBtn.dataset.index;
        // const task = todoTasks[taskIndex];
        const task = await getTaskDetail(taskIndex);

        // Đổi trạng thái hoàn thành
        await toggleCompleteTask(task.id, !task.isCompleted);

        // Lưu và hiển thị lại
        const tasks = await getAllTasks();
        renderTasks(tasks);
    }
};

deleteTaskSubmit.onclick = async function () {
    // Xóa task khỏi danh sách,
    await deleteTask(deleteIndex);

    showToast({
        text: "Delete task successfully!",
        backgroundColor: "#62ac89",
    });

    // Close form
    closeFormDelete();
};

function setHTML(selector, html) {
    const element = document.querySelector(selector);
    element.innerHTML = html;
}

function escapeHTML(str) {
    const mapObj = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, (char) => mapObj[char]);
}

// Hàm hiển thị danh sách task ra màn hình
function renderTasks(tasks) {

    // Nếu chưa có task nào
    if (!tasks?.length) {
        setHTML("#todoList", "<p>Chưa có công việc nào.</p>");
        return;
    }

    // Tạo HTML cho từng task
    const html = tasks
        .map(
            (task) => `
        <div class="task-card ${escapeHTML(task.color)} ${task.isCompleted ? "completed" : ""
                }">
        <div class="task-header">
          <h3 class="task-title">${escapeHTML(task.title)}</h3>
          <button class="task-menu">
            <i class="fa-solid fa-ellipsis fa-icon"></i>
            <div class="dropdown-menu">
              <div class="dropdown-item edit-btn" data-index="${escapeHTML(task.id)}">
                <i class="fa-solid fa-pen-to-square fa-icon"></i>
                Edit
              </div>
              <div class="dropdown-item complete-btn" data-index="${escapeHTML(task.id)}">
                <i class="fa-solid fa-check fa-icon"></i>
                ${task.isCompleted ? "Mark as Active" : "Mark as Complete"} 
              </div>
              <div class="dropdown-item delete delete-btn" data-index="${escapeHTML(task.id)}">
                <i class="fa-solid fa-trash fa-icon"></i>
                Delete
              </div>
            </div>
          </button>
        </div>
        <p class="task-description">${escapeHTML(task.description)}</p>
        <div class="task-time">${escapeHTML(task.startTime)} - ${escapeHTML(task.endTime)}</div>
      </div>
    `
        )
        .join("");

    // Hiển thị HTML ra màn hình
    todoList.innerHTML = html;
}

tabs.onclick = async function (event) {
    const todoTasks = await getAllTasks();

    const tabButton = event.target.closest(".tab-button");
    // Lấy giá trị tab từ data-tab
    const tabActiveValue = tabButton.dataset.tab;


    if (!tabButton) return;

    // Bỏ các `active` khỏi tất cả tab
    $$(".tab-button").forEach((tab) => tab.classList.remove("active"));

    // Active tab vừa click
    tabButton.classList.add("active");

    // Set localStorage mỗi lần click active 1 tab
    saveTabActive(tabActiveValue);

    // Render đúng khi click vào từng tab
    switch (tabActiveValue) {
        case TAB_KEYS.activeTab:
            const activeTasks = todoTasks?.filter(task => !task.isCompleted);
            renderTasks(activeTasks);
            break;

        case "completed-tab":
            const completedTabs = todoTasks?.filter(task => task.isCompleted);
            renderTasks(completedTabs);
            break;

        default:
            renderTasks(todoTasks);
            break;
    }
};

function getTasksByTab(tab) {
    switch (tab) {
        case TAB_KEYS.activeTab:
            return tasks.filter(task => !task.isCompleted);

        case TAB_KEYS.completedTab:
            return tasks.filter(task => task.isCompleted);

        default:
            return tasks;
    }
}

function showToast({
    text = "",
    duration = 2000,
    close = true,
    gravity = "top",
    position = "center",
    backgroundColor = "#4CAF50",
    stopOnFocus = true
}) {
    Toastify({
        text,
        duration,
        close,
        gravity,
        position,
        backgroundColor,
        stopOnFocus,
    }).showToast();
}