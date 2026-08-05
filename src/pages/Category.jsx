import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function Category() {
  const { name } = useParams();

  const storageKey = `listify-${name}`;

  const [newTask, setNewTask] = useState("");

  // Load this category's tasks from localStorage
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem(storageKey);

    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  // Save tasks whenever they change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [tasks, storageKey]);

  // Add task when Enter is pressed
  const handleAddTask = (e) => {
    if (e.key === "Enter" && newTask.trim() !== "") {
      const task = {
        id: Date.now(),
        name: newTask.trim(),
        completed: false,
      };

      setTasks([...tasks, task]);
      setNewTask("");
    }
  };

  // Complete / uncomplete task
  const handleToggleTask = (taskId) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  // Delete one task
  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  // Clear the entire current list
  const handleClearAll = () => {
    setTasks([]);
  };

  return (
    <div className="category-page">

      <div className="category-header">
        <Link to="/" className="back-button">
          ← Back to Listify
        </Link>

        <h1>{name}</h1>
        <p>Keep track of everything you need ✨</p>
      </div>

      <div className="task-section">

        <div className="task-title-row">

          <div>
            <h2>My Tasks</h2>

            <p>
              {tasks.length === 0
                ? "No tasks added yet"
                : `${tasks.length} ${
                    tasks.length === 1 ? "task" : "tasks"
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

        {tasks.length > 0 && (
          <div className="task-list">

            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-item ${
                  task.completed ? "completed-task" : ""
                }`}
              >

                <div className="task-left">

                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id)}
                  />

                  <span className="task-name">
                    {task.name}
                  </span>

                </div>

                <button
                  className="delete-btn"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete task"
                >
                  🗑️
                </button>

              </div>
            ))}

          </div>
        )}

        <div className="quick-add-task">

          <span className="quick-add-plus">+</span>

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