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

  // -----------------------------------------
  // STATE
  // -----------------------------------------
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------------------
  // CHECK API URL
  // -----------------------------------------
  useEffect(() => {
    if (!API_URL) {
      console.error("VITE_API_URL is not defined.");
      setError("Backend URL is not configured.");
    }
  }, [API_URL]);

  // -----------------------------------------
  // LOAD TASKS FROM NEON
  // -----------------------------------------
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError("");

        if (!API_URL) {
          throw new Error("Backend URL is missing.");
        }

        const response = await fetch(`${API_URL}/api/items`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch tasks. Server returned ${response.status}`
          );
        }

        const data = await response.json();

        // Show only tasks belonging to current category
        const categoryTasks = data
          .filter(
            (item) =>
              Number(item.category_id) === Number(categoryId)
          )
          .map((item) => ({
            id: item.item_id,
            name: item.item_name,
            completed: item.is_completed,
          }));

        setTasks(categoryTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Could not load tasks. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      fetchTasks();
    } else {
      setLoading(false);
      setError("Invalid category.");
    }
  }, [API_URL, categoryId]);

  // -----------------------------------------
  // ADD NEW TASK
  // -----------------------------------------
  const handleAddTask = async (e) => {
    if (e.key !== "Enter") {
      return;
    }

    if (newTask.trim() === "") {
      return;
    }

    try {
      setError("");

      if (!API_URL) {
        throw new Error("Backend URL is missing.");
      }

      const response = await fetch(`${API_URL}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_id: categoryId,
          item_name: newTask.trim(),
          priority: "Normal",
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            `Failed to add task. Server returned ${response.status}`
        );
      }

      const savedTask = await response.json();

      const task = {
        id: savedTask.item_id,
        name: savedTask.item_name,
        completed: savedTask.is_completed,
      };

      setTasks((currentTasks) => [task, ...currentTasks]);

      setNewTask("");
    } catch (error) {
      console.error("Error adding task:", error);
      setError("Could not add task. Please try again.");
    }
  };

  // -----------------------------------------
  // COMPLETE / UNCOMPLETE TASK
  // -----------------------------------------
  const handleToggleTask = async (taskId) => {
    try {
      setError("");

      if (!API_URL) {
        throw new Error("Backend URL is missing.");
      }

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

      if (!API_URL) {
        throw new Error("Backend URL is missing.");
      }

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
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Could not delete task. Please try again.");
    }
  };

  // -----------------------------------------
  // CLEAR ALL TASKS IN CURRENT CATEGORY
  // -----------------------------------------
  const handleClearAll = async () => {
    if (tasks.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all ${tasks.length} tasks from ${name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      if (!API_URL) {
        throw new Error("Backend URL is missing.");
      }

      const response = await fetch(
        `${API_URL}/api/categories/${categoryId}/items`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to clear tasks. Server returned ${response.status}`
        );
      }

      setTasks([]);
    } catch (error) {
      console.error("Error clearing tasks:", error);
      setError("Could not clear tasks. Please try again.");
    }
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------
  return (
    <div className="category-page">

      {/* -----------------------------------------
          HEADER
      ----------------------------------------- */}
      <div className="category-header">

        <Link
          to="/"
          className="back-button"
        >
          ← Back to Listify
        </Link>

        <h1>{name}</h1>

        <p>
          Keep track of everything you need ✨
        </p>

      </div>

      {/* -----------------------------------------
          TASK SECTION
      ----------------------------------------- */}
      <div className="task-section">

        {/* -----------------------------------------
            TITLE + CLEAR ALL
        ----------------------------------------- */}
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
            disabled={
              tasks.length === 0 || loading
            }
          >
            Clear All
          </button>

        </div>

        {/* -----------------------------------------
            ERROR MESSAGE
        ----------------------------------------- */}
        {error && (
          <div className="task-error">
            {error}
          </div>
        )}

        {/* -----------------------------------------
            LOADING
        ----------------------------------------- */}
        {loading && (
          <div className="loading-tasks">
            Loading tasks...
          </div>
        )}

        {/* -----------------------------------------
            TASK LIST
        ----------------------------------------- */}
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

                {/* LEFT SIDE */}
                <div className="task-left">

                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={task.completed}
                    onChange={() =>
                      handleToggleTask(task.id)
                    }
                  />

                  <span className="task-name">
                    {task.name}
                  </span>

                </div>

                {/* DELETE BUTTON */}
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

        {/* -----------------------------------------
            QUICK ADD
        ----------------------------------------- */}
        <div className="quick-add-task">

          <span className="quick-add-plus">
            +
          </span>

          <input
            type="text"
            placeholder="Type a new task and press Enter..."
            value={newTask}
            onChange={(e) =>
              setNewTask(e.target.value)
            }
            onKeyDown={handleAddTask}
          />

        </div>

      </div>

    </div>
  );
}

export default Category;