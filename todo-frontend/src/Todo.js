import React, { useState, useEffect } from "react";

export default function Todo() {

  // ------------------- STATES -------------------------
  const [nlInput, setNlInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [todos, setTodos] = useState([]);

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [aiLoading, setAiLoading] = useState(false);

  const apiUrl = "http://localhost:8000";

  // ------------------- LOAD TASKS ---------------------
  useEffect(() => {
    fetch(apiUrl + "/todos")
      .then((res) => res.json())
      .then((data) => setTodos(data));
  }, []);

  // ------------------- MANUAL ADD ---------------------
  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;

    fetch(apiUrl + "/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    })
      .then((res) => res.json())
      .then((saved) => {
        setTodos([...todos, saved]);
        setTitle("");
        setDescription("");
      });
  };

  // ------------------- AI PARSE (NLP) -----------------
  const handleAIParse = async () => {
    if (!nlInput.trim()) return;

    setAiLoading(true);

    try {
      const ai = await fetch(apiUrl + "/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nlInput }),
      }).then((res) => res.json());

      setNlInput("");

      const saved = await fetch(apiUrl + "/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ai),
      }).then((res) => res.json());

      setTodos([...todos, saved]);

    } catch (err) {
      console.log("AI Parse Error:", err);
    }

    setAiLoading(false);
  };

  // ------------------- AI IMPROVE ---------------------
  const improveTask = async (item) => {
    setAiLoading(true);

    try {
      const ai = await fetch(apiUrl + "/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
        }),
      }).then((res) => res.json());

      const updated = await fetch(apiUrl + "/todos/" + item._id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ai.improvedTitle,
          description: ai.improvedDescription,
          category: item.category,
          priority: item.priority,
          dueDate: item.dueDate,
          estimatedTime: item.estimatedTime,
        }),
      }).then((res) => res.json());

      setTodos(todos.map((t) => (t._id === item._id ? updated : t)));

    } catch (err) {
      console.log("AI Improve Error:", err);
    }

    setAiLoading(false);
  };

  // ------------------- EDIT ---------------------
  const handleEdit = (item) => {
    setEditId(item._id);
    setEditTitle(item.title);
    setEditDescription(item.description);
  };

  const handleUpdate = () => {
    fetch(apiUrl + "/todos/" + editId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
      }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setTodos(todos.map((t) => (t._id === editId ? updated : t)));
        setEditId(null);
      });
  };

  // ------------------- DELETE ---------------------
  const handleDelete = (id) => {
    if (!window.confirm("Delete this task?")) return;

    fetch(apiUrl + "/todos/" + id, { method: "DELETE" }).then(() =>
      setTodos(todos.filter((t) => t._id !== id))
    );
  };

  // ------------------- UI BADGES ---------------------
  const PriorityBadge = ({ priority }) => {
    if (!priority) return null;

    const colors = {
      High: "danger",
      Medium: "warning",
      Low: "success",
    };

    return (
      <span className={`badge bg-${colors[priority] || "secondary"} ms-2`}>
        {priority}
      </span>
    );
  };

  const CategoryBadge = ({ category }) => {
    if (!category) return null;

    return <span className="badge bg-primary ms-2">{category}</span>;
  };

  // ------------------- RENDER ---------------------
  return (
    <div className="container py-4">
      <h1 className="mb-4 text-success fw-bold">AI Powered ToDo </h1>

      {/* AI INPUT */}
      <div className="card p-3 mb-4">
        <h5>AI Add Task (Natural Language)</h5>

        <div className="d-flex gap-2">
          <input
            className="form-control"
            placeholder="Eg: Finish assignment tomorrow evening"
            value={nlInput}
            onChange={(e) => setNlInput(e.target.value)}
          />

          <button className="btn btn-primary" onClick={handleAIParse}>
            {aiLoading ? "Thinking..." : "AI Add"}
          </button>
        </div>
      </div>

      {/* MANUAL ADD */}
      <div className="card p-3 mb-4">
        <h5>Manual Add</h5>

        <div className="d-flex gap-2">
          <input
            className="form-control"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="form-control"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button className="btn btn-dark" onClick={handleSubmit}>
            Add
          </button>
        </div>
      </div>

      {/* TASKS */}
      <h3>Your Tasks</h3>

      <ul className="list-group">
        {todos.map((item) => (
          <li
            key={item._id}
            className="list-group-item d-flex justify-content-between align-items-start"
          >
            <div className="flex-grow-1">

              {editId === item._id ? (
                <>
                  <input
                    className="form-control mb-2"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />

                  <input
                    className="form-control"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </>
              ) : (
                <>
                  <b>{item.title}</b>

                  <CategoryBadge category={item.category} />
                  <PriorityBadge priority={item.priority} />

                  <br />
                  <span>{item.description}</span>

                  {item.dueDate && (
                    <div className="text-muted small mt-1">
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  {item.estimatedTime && (
                    <div className="text-muted small">
                      Estimated Time: {item.estimatedTime}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="d-flex flex-column gap-2 ms-3">

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => improveTask(item)}
                disabled={aiLoading}
              >
                {aiLoading ? "Improving..." : "Improve"}
              </button>

              {editId === item._id ? (
                <button className="btn btn-warning btn-sm" onClick={handleUpdate}>
                  Update
                </button>
              ) : (
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>
              )}

              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(item._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
