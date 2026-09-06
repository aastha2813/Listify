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

  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState([]);

  // -----------------------------------------
  // LOAD TASKS FROM NEON
  // -----------------------------------------
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${API_URL}/api/items`);

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();

        // Show only tasks belonging to current category
        const categoryTasks = data
          .filter((item) => item.category_id === categoryId)
          .map((item) => ({
            id: item.item_id,
            name: item.item_name,
            completed: item.is_completed,
          }));

        setTasks(categoryTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };

    if (categoryId) {
      fetchTasks();
    }
  }, [categoryId]);

  // -----------------------------------------
  // ADD NEW TASK
  // -----------------------------------------
  const handleAddTask = async (e) => {
    if (e.key === "Enter" && newTask.trim() !== "") {
      try {
        const response = await fetch(`${API_URL}/api/items`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            category_id: categoryId,
            item_name: newTask.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add task");
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
      }
    }
  };

  // -----------------------------------------
  // COMPLETE / UNCOMPLETE TASK
  // -----------------------------------------
  const handleToggleTask = async (taskId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/items/${taskId}/toggle`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
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
    }
  };

  // -----------------------------------------
  // DELETE ONE TASK
  // -----------------------------------------
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/items/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // -----------------------------------------
  // CLEAR ALL TASKS IN CURRENT CATEGORY
  // -----------------------------------------
  const handleClearAll = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/categories/${categoryId}/items`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to clear tasks");
      }

      setTasks([]);
    } catch (error) {
      console.error("Error clearing tasks:", error);
    }
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------
  return (
    <div className="category-page">

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

      <div className="task-section">

        <div className="task-title-row">

          <div>

            <h2>My Tasks</h2>

            <p>
              {tasks.length === 0
                ? "No tasks added yet"
                : `${tasks.length} ${
                    tasks.length === 1
                      ? "task"
                      : "tasks"
                  }`}
            </p>

          </div>

          {tasks.length > 0 && (
            <button
              className="clear-all-btn"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}

        </div>

        {/* TASK LIST */}

        {tasks.length > 0 && (
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

                  <span className="task-name">
                    {task.name}
                  </span>

                </div>

                <button
                  className="delete-btn"
                  onClick={() =>
                    handleDeleteTask(task.id)
                  }
                  title="Delete task"
                >
                  🗑️
                </button>

              </div>

            ))}

          </div>
        )}

        {/* QUICK ADD */}

        <div className="quick-add-task">

          <span className="quick-add-plus">
            +
          </span>

          <input
            type="text"
            placeholder="Type a new task and press Enter..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleAddTask}
          />

        </div>

      </div>

    </div>
  );
}

export default Category;