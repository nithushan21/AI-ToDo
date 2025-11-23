import React, { useState, useEffect } from "react";
import { getToken } from "./auth";
import logo from "./logo.png";

export default function Todo({ onLogout = () => { } }) {

    // ------------------- STATES -------------------------
    const [nlInput, setNlInput] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [todos, setTodos] = useState([]);

    const [editId, setEditId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const [aiLoading, setAiLoading] = useState(false);
    // Dark mode state (persisted)
    const [darkMode, setDarkMode] = useState(() => {
        try {
            return localStorage.getItem("darkMode") === "true";
        } catch (e) {
            return false;
        }
    });

    const apiUrl = "http://localhost:8000";

    const apiFetch = (path, opts = {}) => {
        const token = getToken();
        const headers = {
            "Content-Type": "application/json",
            ...(opts.headers || {}),
        };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return fetch(apiUrl + path, { ...opts, headers });
    };

    // apply/remove dark mode class on the document element
    useEffect(() => {
        try {
            if (darkMode) {
                document.documentElement.classList.add("dark-mode");
            } else {
                document.documentElement.classList.remove("dark-mode");
            }
            localStorage.setItem("darkMode", darkMode ? "true" : "false");
        } catch (e) {
            // ignore (SSR or blocked storage)
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode((d) => !d);

    // ------------------- LOAD TASKS ---------------------
    useEffect(() => {
        apiFetch("/todos")
            .then((res) => res.json())
            .then((data) => setTodos(data));
    }, []);

    // ------------------- MANUAL ADD ---------------------
    const handleSubmit = () => {
        if (!title.trim() || !description.trim()) return;

        apiFetch("/todos", {
            method: "POST",
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
            const ai = await apiFetch("/ai/parse", {
                method: "POST",
                body: JSON.stringify({ text: nlInput }),
            }).then((res) => res.json());

            setNlInput("");

            const saved = await apiFetch("/todos", {
                method: "POST",
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
            const ai = await apiFetch("/ai/improve", {
                method: "POST",
                body: JSON.stringify({
                    title: item.title,
                    description: item.description,
                }),
            }).then((res) => res.json());

            const updated = await apiFetch("/todos/" + item._id, {
                method: "PUT",
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
        apiFetch("/todos/" + editId, {
            method: "PUT",
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

        apiFetch("/todos/" + id, { method: "DELETE" }).then(() =>
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
            <span className={`badge bg-${colors[priority] || "secondary"}`}>
                {priority}
            </span>
        );
    };

    const CategoryBadge = ({ category }) => {
        if (!category) return null;

        return <span className="badge bg-primary">{category}</span>;
    };

    // ------------------- RENDER ---------------------
    return (
        <div className="todo-bg">

            {/* Navbar header */}
            <nav className="modern-navbar mb-4 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <img src={logo} alt="App Logo" className="nav-logo" />
                    <span className="navbar-brand fw-bold text-dark m-0">AI Powered ToDo</span>
                </div>

                <div>
                    <button
                        className="btn btn-outline-secondary me-2"
                        onClick={toggleDarkMode}
                        title="Toggle dark mode"
                    >
                        {darkMode ? "Light" : "Dark"}
                    </button>

                    <button className="btn btn-outline-secondary me-2" onClick={() => window.location.reload()} title="Refresh">
                        Refresh
                    </button>
                    <button className="btn btn-danger" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            <div className="container py-4" style={{ maxWidth: "900px" }}>

                {/* AI INPUT */}
                <div className="card modern-card p-4 mb-4">
                    <h5 className="fw-semibold mb-3">✨ AI Add Task</h5>

                    <div className="d-flex gap-2">
                        <input
                            className="form-control modern-input"
                            placeholder="Eg: Finish assignment tomorrow evening"
                            value={nlInput}
                            onChange={(e) => setNlInput(e.target.value)}
                        />

                        <button className="btn btn-primary modern-btn" onClick={handleAIParse}>
                            {aiLoading ? "Thinking..." : "AI Add"}
                        </button>
                    </div>
                </div>

                {/* Manual Input */}
                <div className="card modern-card p-4 mb-4">
                    <h5 className="fw-semibold mb-3">📝 Manual Add</h5>

                    <div className="d-flex gap-2">
                        <input
                            className="form-control modern-input"
                            placeholder="Task title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <input
                            className="form-control modern-input"
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <button className="btn btn-dark modern-btn" onClick={handleSubmit}>
                            Add
                        </button>
                    </div>
                </div>

                {/* TASK LIST */}
                <h4 className="fw-bold mb-3">Your Tasks</h4>

                <ul className="list-group modern-list">
                    {todos.map((item) => (
                        <li
                            key={item._id}
                            className="list-group-item modern-item d-flex justify-content-between align-items-start"
                        >
                            <div className="flex-grow-1">

                                {editId === item._id ? (
                                    <>
                                        <input
                                            className="form-control modern-input mb-2"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                        />

                                        <input
                                            className="form-control modern-input"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className="fw-semibold fs-5 text-dark">{item.title}</div>

                                        <div className="text-muted">{item.description}</div>

                                        {/* {item.dueDate && (
                                            <div className="text-muted small mt-1">
                                                📅 Due: {new Date(item.dueDate).toLocaleDateString()}
                                            </div>
                                        )} */}

                                        {item.estimatedTime && (
                                            <div className="text-muted small">
                                                ⏳ Time: {item.estimatedTime}
                                            </div>
                                        )}

                                        <div className="d-flex align-items-center gap-2 mt-2">
                                            <CategoryBadge category={item.category} />
                                            <PriorityBadge priority={item.priority} />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="d-flex flex-column gap-2 ms-3">
                                <button
                                    className="btn btn-outline-secondary btn-sm modern-btn-small"
                                    onClick={() => improveTask(item)}
                                    disabled={aiLoading}
                                >
                                    {aiLoading ? "Improving..." : "Improve"}
                                </button>

                                {editId === item._id ? (
                                    <button
                                        className="btn btn-warning btn-sm modern-btn-small"
                                        onClick={handleUpdate}
                                    >
                                        Update
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-warning btn-sm modern-btn-small"
                                        onClick={() => handleEdit(item)}
                                    >
                                        Edit
                                    </button>
                                )}

                                <button
                                    className="btn btn-danger btn-sm modern-btn-small"
                                    onClick={() => handleDelete(item._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Modern CSS */}
            <style>{`
      .todo-bg {
        background: linear-gradient(135deg, #f8faff 0%, #eef3ff 100%);
        min-height: 100vh;
        padding-bottom: 50px;
      }
                /* Dark mode overrides */
                .dark-mode .todo-bg {
                    background: linear-gradient(135deg, #0f172a 0%, #071129 100%);
                    color: #e6eef8;
                }
                .dark-mode .modern-card,
                .dark-mode .modern-item {
                    background: #0b1220;
                    border-color: #122234;
                    box-shadow: none;
                }
                .dark-mode .modern-input {
                    background: #071023 !important;
                    color: #e6eef8 !important;
                    border: 1px solid #223448 !important;
                }
                .dark-mode .modern-navbar {
                    background: rgba(6,10,20,0.98);
                    box-shadow: 0 8px 30px rgba(2,6,23,0.7);
                }
                .dark-mode .navbar-brand,
                .dark-mode .text-muted,
                .dark-mode .text-dark {
                    color: #e6eef8 !important;
                }
                .dark-mode .modern-btn.btn-primary,
                .dark-mode .modern-navbar .btn.btn-primary {
                    color: #8b5cf6 !important;
                    border-color: #8b5cf6 !important;
                }
                .dark-mode .modern-btn.btn-dark,
                .dark-mode .modern-navbar .btn.btn-dark {
                    color: #cbd5e1 !important;
                    border-color: #475569 !important;
                }
                .dark-mode .modern-btn-small.btn-warning,
                .dark-mode .modern-navbar .btn.btn-warning {
                    color: #f59e0b !important;
                    border-color: #f59e0b !important;
                }
                .dark-mode .modern-btn-small.btn-danger,
                .dark-mode .modern-navbar .btn.btn-danger,
                .dark-mode .modern-btn.btn-danger {
                    color: #fda4af !important;
                    border-color: #f87171 !important;
                }

            .modern-card {
                border: none;
                background: white;
                border-radius: 0px;
                box-shadow: 0px 4px 20px rgba(0,0,0,0.08);
            }

      .modern-input {
        border-radius: 5px !important;
        padding: 12px !important;
        border: 1px solid #d5d9e0;
        transition: 0.2s;
      }

      .modern-input:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
      }

      .modern-btn {
        border-radius: 5px;
        padding: 10px 18px;
      }

            .modern-btn {
                border-radius: 5px;
                padding: 10px 18px;
                min-width: 120px;
            }

            .modern-btn-small {
                border-radius: 5px;
                min-width: 100px;
            }

            /* Navbar buttons slightly wider for better touch targets */
            .modern-navbar .btn {
                min-width: 100px;
            }
            /* Make button backgrounds transparent and use colored text + border */
            .modern-btn.btn-primary,
            .modern-navbar .btn.btn-primary {
                background: transparent !important;
                color: #4f46e5 !important; /* indigo */
                border: 2px solid #4f46e5 !important;
                box-shadow: none !important;
            }
            .modern-btn.btn-primary:hover,
            .modern-navbar .btn.btn-primary:hover {
                background: rgba(79,70,229,0.06) !important;
            }

            .modern-btn.btn-dark,
            .modern-navbar .btn.btn-dark {
                background: transparent !important;
                color: #374151 !important; /* gray-700 */
                border: 2px solid #374151 !important;
                box-shadow: none !important;
            }
            .modern-btn.btn-dark:hover,
            .modern-navbar .btn.btn-dark:hover {
                background: rgba(55,65,81,0.06) !important;
            }

            .modern-btn-small.btn-warning,
            .modern-navbar .btn.btn-warning {
                background: transparent !important;
                color: #d97706 !important; /* amber-600 */
                border: 1.5px solid #d97706 !important;
                box-shadow: none !important;
            }
            .modern-btn-small.btn-warning:hover,
            .modern-navbar .btn.btn-warning:hover {
                background: rgba(217,119,6,0.06) !important;
            }

            .modern-btn-small.btn-danger,
            .modern-navbar .btn.btn-danger,
            .modern-btn.btn-danger {
                background: transparent !important;
                color: #dc2626 !important; /* red-600 */
                border: 1.5px solid #dc2626 !important;
                box-shadow: none !important;
            }
            .modern-btn-small.btn-danger:hover,
            .modern-navbar .btn.btn-danger:hover,
            .modern-btn.btn-danger:hover {
                background: rgba(220,38,38,0.06) !important;
            }

      .modern-list {
        gap: 10px;
      }

            .modern-item {
                background: #fff;
                border-radius: 5px;
                margin-bottom: 12px;
                border: 1px solid #eceff5;
                box-shadow: 0px 2px 10px rgba(0,0,0,0.05);
                padding: 16px;
            }
            .modern-navbar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                width: 100%;
                background: rgba(255,255,255,0.98);
                padding: 14px 20px;
                border-radius: 0;
                box-shadow: 0 8px 30px rgba(31,41,55,0.08);
                z-index: 1000; /* keep navbar above cards when scrolling */
            }
      .modern-navbar .navbar-brand { font-size: 1.25rem; }
            /* ensure content sits below the fixed navbar */
            .todo-bg {
                padding-top: 84px; /* space for fixed navbar */
            }
                .nav-logo {
    width: 94px;
    height: 44px;
    object-fit: contain;
    border-radius: 8px;
}

    `}</style>
        </div>
    );
}
