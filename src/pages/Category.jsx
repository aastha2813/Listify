import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import AddTaskModal from "../components/AddTaskModal";

function Category() {
  const { name } = useParams();

  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]);

  const handleAddTask = (taskName) => {
    const newTask = {
      id: Date.now(),
      name: taskName,
      completed: false,
    };

    setTasks([...tasks, newTask]);
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
                : `${tasks.length} task${tasks.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            className="add-task-button"
            onClick={() => setShowModal(true)}
          >
            + Add Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-tasks">
            <div className="empty-icon">📝</div>
            <h3>Nothing here yet!</h3>
            <p>Add your first task to get started.</p>

            <button
              className="empty-add-button"
              onClick={() => setShowModal(true)}
            >
              + Add your first task
            </button>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div className="task-item" key={task.id}>
                <span className="task-checkbox">⬜</span>
                <span>{task.name}</span>
              </div>
            ))}
          </div>
        )}

      </div>

      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          onAddTask={handleAddTask}
        />
      )}

    </div>
  );
}

export default Category;