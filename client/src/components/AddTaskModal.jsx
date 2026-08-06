import { useState } from "react";

function AddTaskModal({ onClose, onAddTask }) {
  const [taskName, setTaskName] = useState("");

  const handleSubmit = () => {
    if (taskName.trim() === "") return;

    onAddTask(taskName.trim());
    setTaskName("");
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="task-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div className="modal-icon">✨</div>

        <h2>Add New Task</h2>
        <p>What do you need to get done?</p>

        <input
          className="task-input"
          type="text"
          placeholder="Enter task..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />

        <div className="modal-buttons">
          <button
            className="cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="modal-add-button"
            onClick={handleSubmit}
          >
            + Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTaskModal;