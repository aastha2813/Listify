import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function Category() {
  const { name } = useParams();

  // -----------------------------------------
  // BACKEND API URL
  // -----------------------------------------
  const API_URL = import.meta.env.VITE_API_URL;

  // -----------------------------------------
  // CATEGORY NAME → DATABASE ID
  // -----------------------------------------
  const categoryIds = {
    Vinayak: 1,
    Raju: 2,
    "D-Mart": 3,
    Others: 4,
    Ahmedabad: 5,
    Surat: 6,
  };

  const categoryId = categoryIds[name];

  // Raju does not use sub-lists
  const isRaju = name === "Raju";

  // -----------------------------------------
  // SUB-LIST STATE
  // -----------------------------------------
  const [subLists, setSubLists] = useState([]);
  const [selectedSubList, setSelectedSubList] = useState(null);

  const [newListName, setNewListName] = useState("");
  const [editingListId, setEditingListId] = useState(null);
  const [editingListName, setEditingListName] = useState("");

  // -----------------------------------------
  // TASK STATE
  // -----------------------------------------
  const [tasks, setTasks] = useState([]);

  const [newTask, setNewTask] = useState("");
  const [quantity, setQuantity] = useState("");

  // -----------------------------------------
  // UI STATE
  // -----------------------------------------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  // -----------------------------------------
  // LOAD SUB-LISTS
  // -----------------------------------------
  useEffect(() => {
    if (isRaju || !categoryId) {
      return;
    }

    const fetchSubLists = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/categories/${categoryId}/sub-lists`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch sub-lists. Server returned ${response.status}`
          );
        }

        const data = await response.json();

        setSubLists(data);
      } catch (error) {
        console.error("Error fetching sub-lists:", error);
        setError("Could not load lists. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubLists();
  }, [API_URL, categoryId, isRaju]);

  // -----------------------------------------
  // LOAD RAJU TASKS
  // -----------------------------------------
  useEffect(() => {
    if (!isRaju || !categoryId) {
      return;
    }

    const fetchRajuTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/categories/${categoryId}/items`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch tasks. Server returned ${response.status}`
          );
        }

        const data = await response.json();

        const formattedTasks = data.map((item) => ({
          id: item.item_id,
          name: item.item_name,
          quantity: item.quantity,
          completed: item.is_completed,
        }));

        setTasks(formattedTasks);
      } catch (error) {
        console.error("Error fetching Raju tasks:", error);
        setError("Could not load tasks. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchRajuTasks();
  }, [API_URL, categoryId, isRaju]);

  // -----------------------------------------
  // LOAD TASKS FOR SELECTED SUB-LIST
  // -----------------------------------------
  useEffect(() => {
    if (isRaju || !selectedSubList) {
      return;
    }

    const fetchSubListTasks = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/sub-lists/${selectedSubList.sub_list_id}/items`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch tasks. Server returned ${response.status}`
          );
        }

        const data = await response.json();

        const formattedTasks = data.map((item) => ({
          id: item.item_id,
          name: item.item_name,
          quantity: item.quantity,
          completed: item.is_completed,
        }));

        setTasks(formattedTasks);
      } catch (error) {
        console.error("Error fetching sub-list tasks:", error);
        setError("Could not load tasks. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubListTasks();
  }, [API_URL, selectedSubList, isRaju]);

  // -----------------------------------------
  // ADD NEW SUB-LIST
  // -----------------------------------------
  const handleAddList = async () => {
    if (newListName.trim() === "") {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/categories/${categoryId}/sub-lists`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sub_list_name: newListName.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            `Failed to create list. Server returned ${response.status}`
        );
      }

      const newList = await response.json();

      setSubLists((currentLists) => [
        ...currentLists,
        {
          ...newList,
          task_count: 0,
        },
      ]);

      setNewListName("");
      setShowListModal(false);
    } catch (error) {
      console.error("Error adding list:", error);
      setError(
        error.message || "Could not create the list. Please try again."
      );
    }
  };

  // -----------------------------------------
  // START EDITING SUB-LIST
  // -----------------------------------------
  const startEditingList = (list) => {
    setEditingListId(list.sub_list_id);
    setEditingListName(list.sub_list_name);
  };

  // -----------------------------------------
  // SAVE EDITED SUB-LIST
  // -----------------------------------------
  const handleEditList = async (listId) => {
    if (editingListName.trim() === "") {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/sub-lists/${listId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sub_list_name: editingListName.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            `Failed to edit list. Server returned ${response.status}`
        );
      }

      const updatedList = await response.json();

      setSubLists((currentLists) =>
        currentLists.map((list) =>
          list.sub_list_id === listId
            ? {
                ...list,
                sub_list_name: updatedList.sub_list_name,
              }
            : list
        )
      );

      setEditingListId(null);
      setEditingListName("");
    } catch (error) {
      console.error("Error editing list:", error);
      setError(
        error.message || "Could not edit the list. Please try again."
      );
    }
  };

  // -----------------------------------------
  // DELETE SUB-LIST
  // -----------------------------------------
  const handleDeleteList = async (list) => {
    if (list.task_count > 0) {
      window.alert(
        "This list contains tasks. Please clear its tasks before deleting the list."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${list.sub_list_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/sub-lists/${list.sub_list_id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete list. Server returned ${response.status}`
        );
      }

      setSubLists((currentLists) =>
        currentLists.filter(
          (currentList) =>
            currentList.sub_list_id !== list.sub_list_id
        )
      );
    } catch (error) {
      console.error("Error deleting list:", error);
      setError(
        error.message || "Could not delete the list. Please try again."
      );
    }
  };

  // -----------------------------------------
  // OPEN SUB-LIST
  // -----------------------------------------
  const openSubList = (list) => {
    setSelectedSubList(list);
    setTasks([]);
  };

  // -----------------------------------------
  // GO BACK TO SUB-LISTS
  // -----------------------------------------
  const backToLists = () => {
    setSelectedSubList(null);
    setTasks([]);
    setError("");
  };

  // -----------------------------------------
  // OPEN ADD TASK MODAL
  // -----------------------------------------
  const openTaskModal = () => {
    setNewTask("");
    setQuantity("");
    setError("");
    setShowTaskModal(true);
  };

  // -----------------------------------------
  // ADD NEW TASK
  // -----------------------------------------
  const handleAddTask = async () => {
    if (newTask.trim() === "") {
      setError("Please enter a task name.");
      return;
    }

    if (quantity.trim() === "") {
      setError("Quantity is required.");
      return;
    }

    try {
      setError("");

      const body = {
        category_id: categoryId,
        item_name: newTask.trim(),
        quantity: quantity.trim(),
        priority: "Normal",
      };

      if (!isRaju) {
        body.sub_list_id = selectedSubList.sub_list_id;
      }

      const response = await fetch(`${API_URL}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            `Failed to add task. Server returned ${response.status}`
        );
      }

      const savedTask = await response.json();

      const task = {
        id: savedTask.item_id,
        name: savedTask.item_name,
        quantity: savedTask.quantity,
        completed: savedTask.is_completed,
      };

      setTasks((currentTasks) => [task, ...currentTasks]);

      // Update task count for sub-list
      if (!isRaju) {
        setSubLists((currentLists) =>
          currentLists.map((list) =>
            list.sub_list_id === selectedSubList.sub_list_id
              ? {
                  ...list,
                  task_count: Number(list.task_count || 0) + 1,
                }
              : list
          )
        );
      }

      setNewTask("");
      setQuantity("");
      setShowTaskModal(false);
    } catch (error) {
      console.error("Error adding task:", error);
      setError(
        error.message || "Could not add task. Please try again."
      );
    }
  };

  // -----------------------------------------
  // COMPLETE / UNCOMPLETE TASK
  // -----------------------------------------
  const handleToggleTask = async (taskId) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/items/${taskId}/toggle`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update task. Server returned ${response.status}`
        );
      }

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: updatedTask.is_completed,
              }
            : task
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Could not update task. Please try again.");
    }
  };

  // -----------------------------------------
  // DELETE ONE TASK
  // -----------------------------------------
  const handleDeleteTask = async (taskId) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/items/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete task. Server returned ${response.status}`
        );
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );

      if (!isRaju) {
        setSubLists((currentLists) =>
          currentLists.map((list) =>
            list.sub_list_id === selectedSubList.sub_list_id
              ? {
                  ...list,
                  task_count: Math.max(
                    0,
                    Number(list.task_count || 0) - 1
                  ),
                }
              : list
          )
        );
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Could not delete task. Please try again.");
    }
  };

  // -----------------------------------------
  // CLEAR ALL TASKS
  // -----------------------------------------
  const handleClearAll = async () => {
    if (tasks.length === 0) {
      return;
    }

    const locationName = isRaju
      ? name
      : selectedSubList?.sub_list_name;

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${tasks.length} tasks from ${locationName}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      let url;

      if (isRaju) {
        url = `${API_URL}/api/categories/${categoryId}/items`;
      } else {
        url = `${API_URL}/api/sub-lists/${selectedSubList.sub_list_id}/items`;
      }

      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to clear tasks. Server returned ${response.status}`
        );
      }

      setTasks([]);

      if (!isRaju) {
        setSubLists((currentLists) =>
          currentLists.map((list) =>
            list.sub_list_id === selectedSubList.sub_list_id
              ? {
                  ...list,
                  task_count: 0,
                }
              : list
          )
        );
      }
    } catch (error) {
      console.error("Error clearing tasks:", error);
      setError("Could not clear tasks. Please try again.");
    }
  };

  // -----------------------------------------
  // INVALID CATEGORY
  // -----------------------------------------
  if (!categoryId) {
    return (
      <div className="category-page">
        <div className="category-header">
          <Link to="/" className="back-button">
            ← Back to Listify
          </Link>

          <h1>Invalid Category</h1>
          <p>
            Please return to Listify and select a valid category.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // SUB-LIST VIEW
  // -----------------------------------------
  if (!isRaju && !selectedSubList) {
    return (
      <div className="category-page">
        <div className="category-header">
          <Link to="/" className="back-button">
            ← Back to Listify
          </Link>

          <h1>{name}</h1>

          <p>
            Choose a list to manage your tasks ✨
          </p>
        </div>

        <div className="task-section">
          <div className="task-title-row">
            <div>
              <h2>My Lists</h2>

              <p>
                {loading
                  ? "Loading lists..."
                  : `${subLists.length} ${
                      subLists.length === 1
                        ? "list"
                        : "lists"
                    }`}
              </p>
            </div>

            <button
              className="add-task-button"
              onClick={() => {
                setNewListName("");
                setError("");
                setShowListModal(true);
              }}
            >
              + Add New List
            </button>
          </div>

          {error && (
            <div className="task-error">
              {error}
            </div>
          )}

          {loading && (
            <div className="loading-tasks">
              Loading lists...
            </div>
          )}

          {!loading && subLists.length === 0 && (
            <div className="empty-tasks">
              <div className="empty-icon">📋</div>

              <h3>No lists yet</h3>

              <p>
                Create your first list for {name}.
              </p>

              <button
                className="empty-add-button"
                onClick={() => {
                  setNewListName("");
                  setError("");
                  setShowListModal(true);
                }}
              >
                + Add New List
              </button>
            </div>
          )}

          {!loading && subLists.length > 0 && (
            <div className="sub-list-container">
              {subLists.map((list) => (
                <div
                  key={list.sub_list_id}
                  className="sub-list-card"
                >
                  {editingListId === list.sub_list_id ? (
                    <div className="edit-list-row">
                      <input
                        type="text"
                        value={editingListName}
                        onChange={(e) =>
                          setEditingListName(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEditList(list.sub_list_id);
                          }
                        }}
                        autoFocus
                      />

                      <button
                        className="save-list-btn"
                        onClick={() =>
                          handleEditList(list.sub_list_id)
                        }
                      >
                        Save
                      </button>

                      <button
                        className="cancel-list-btn"
                        onClick={() => {
                          setEditingListId(null);
                          setEditingListName("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="sub-list-main"
                        onClick={() => openSubList(list)}
                      >
                        <span className="sub-list-icon">
                          📋
                        </span>

                        <span className="sub-list-info">
                          <strong>
                            {list.sub_list_name}
                          </strong>

                          <small>
                            {Number(list.task_count || 0)}{" "}
                            {Number(list.task_count || 0) === 1
                              ? "task"
                              : "tasks"}
                          </small>
                        </span>

                        <span className="sub-list-arrow">
                          →
                        </span>
                      </button>

                      <div className="sub-list-actions">
                        <button
                          type="button"
                          onClick={() =>
                            startEditingList(list)
                          }
                          title="Edit list"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteList(list)
                          }
                          title="Delete list"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ADD LIST MODAL */}
        {showListModal && (
          <div className="modal-overlay">
            <div className="task-modal">
              <button
                className="modal-close"
                onClick={() => setShowListModal(false)}
              >
                ×
              </button>

              <div className="modal-icon">📋</div>

              <h2>Add New List</h2>

              <p>
                Create a new list inside {name}.
              </p>

              <input
                className="task-input"
                type="text"
                placeholder="List name"
                value={newListName}
                onChange={(e) =>
                  setNewListName(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddList();
                  }
                }}
                autoFocus
              />

              <div className="modal-buttons">
                <button
                  className="cancel-button"
                  onClick={() => setShowListModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="modal-add-button"
                  onClick={handleAddList}
                >
                  Add List
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------
  // TASK VIEW
  // -----------------------------------------
  const currentTitle = isRaju
    ? name
    : selectedSubList.sub_list_name;

  return (
    <div className="category-page">
      <div className="category-header">
        {isRaju ? (
          <Link to="/" className="back-button">
            ← Back to Listify
          </Link>
        ) : (
          <button
            className="back-button back-button-link"
            onClick={backToLists}
          >
            ← Back to {name}
          </button>
        )}

        <h1>{currentTitle}</h1>

        <p>
          {isRaju
            ? "Keep track of everything you need ✨"
            : `${name} • ${currentTitle}`}
        </p>
      </div>

      <div className="task-section">
        <div className="task-title-row">
          <div>
            <h2>My Tasks</h2>

            <p>
              {loading
                ? "Loading tasks..."
                : tasks.length === 0
                ? "No tasks added yet"
                : `${tasks.length} ${
                    tasks.length === 1
                      ? "task"
                      : "tasks"
                  }`}
            </p>
          </div>

          <button
            className="clear-all-btn"
            onClick={handleClearAll}
            disabled={tasks.length === 0 || loading}
          >
            Clear All
          </button>
        </div>

        {error && (
          <div className="task-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-tasks">
            Loading tasks...
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="empty-tasks">
            <div className="empty-icon">📝</div>

            <h3>No tasks yet</h3>

            <p>
              Add something you need to remember.
            </p>

            <button
              className="empty-add-button"
              onClick={openTaskModal}
            >
              + Add Task
            </button>
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div className="task-list">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-item ${
                  task.completed
                    ? "completed-task"
                    : ""
                }`}
              >
                <div className="task-left">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={task.completed}
                    onChange={() =>
                      handleToggleTask(task.id)
                    }
                  />

                  <div className="task-content">
                    <span className="task-name">
                      {task.name}
                    </span>

                    <span className="task-quantity">
                      Qty: {task.quantity}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="delete-btn"
                  onClick={() =>
                    handleDeleteTask(task.id)
                  }
                  title="Delete task"
                  aria-label={`Delete ${task.name}`}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          className="add-task-button task-bottom-add"
          onClick={openTaskModal}
        >
          + Add Task
        </button>
      </div>

      {/* ADD TASK MODAL */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="task-modal">
            <button
              className="modal-close"
              onClick={() => setShowTaskModal(false)}
            >
              ×
            </button>

            <div className="modal-icon">📝</div>

            <h2>Add New Task</h2>

            <p>
              Add a task and its quantity.
            </p>

            {error && (
              <div className="task-error">
                {error}
              </div>
            )}

            <input
              className="task-input"
              type="text"
              placeholder="What do you need?"
              value={newTask}
              onChange={(e) =>
                setNewTask(e.target.value)
              }
              autoFocus
            />

            <input
              className="task-input quantity-input"
              type="text"
              placeholder="Quantity *"
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddTask();
                }
              }}
            />

            <div className="modal-buttons">
              <button
                className="cancel-button"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </button>

              <button
                className="modal-add-button"
                onClick={handleAddTask}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Category;