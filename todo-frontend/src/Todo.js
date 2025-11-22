import React, { useState, useEffect } from 'react';

export default function Todo() {

    const [nlInput, setNlInput] = useState("");     // AI natural input
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [todos, setTodos] = useState([]);
    const [message, setMessage] = useState("");
    const [editId, setEditId] = useState(-1);

    const apiUrl = "http://localhost:8000";

    // Edit fields
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    useEffect(() => {
        getItems();
    }, []);

    const getItems = () => {
        fetch(apiUrl + "/todos")
            .then(res => res.json())
            .then(res => setTodos(res));
    };

    // ---------------------------
    // NORMAL (Manual) ADD
    // ---------------------------
    const handleSubmit = () => {
        setError("");
        if (title.trim() !== "" && description.trim() !== "") {

            fetch(apiUrl + "/todos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description })
            })
                .then(res => res.json())
                .then(saved => {
                    setTodos([...todos, saved]);
                    setTitle("");
                    setDescription("");
                })
                .catch(() => setError("Failed to add item"));
        }
    };

    // ---------------------------
    // 1️⃣ AI PARSE TASK
    // ---------------------------
    const handleAIParse = () => {
        if (!nlInput.trim()) return;

        fetch(apiUrl + "/ai/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: nlInput })
        })
            .then(res => res.json())
            .then(async ai => {

                const res = await fetch(apiUrl + "/todos", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ai)
                });

                const saved = await res.json();

                setTodos([...todos, saved]);
                setNlInput("");
            });
    };

    // ---------------------------
    // 2️⃣ AI IMPROVE TASK
    // ---------------------------
    const improveTask = (item) => {
        fetch(apiUrl + "/ai/improve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: item.title,
                description: item.description
            })
        })
            .then(res => res.json())
            .then(async ai => {

                const res = await fetch(apiUrl + "/todos/" + item._id, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: ai.improvedTitle,
                        description: ai.improvedDescription
                    })
                });

                const updated = await res.json();

                setTodos(todos.map(t => t._id === item._id ? updated : t));
            });
    };

    // ---------------------------
    // EDIT & DELETE
    // ---------------------------
    const handleEdit = (item) => {
        setEditId(item._id);
        setEditTitle(item.title);
        setEditDescription(item.description);
    };

    const handleUpdate = () => {
        fetch(apiUrl + "/todos/" + editId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: editTitle, description: editDescription })
        })
            .then(res => res.json())
            .then(updated => {
                setTodos(todos.map(t => t._id === editId ? updated : t));
                setEditId(-1);
            });
    };

    const handleDelete = (id) => {
        if (!window.confirm("Are you sure?")) return;

        fetch(apiUrl + "/todos/" + id, { method: "DELETE" })
            .then(() => setTodos(todos.filter(t => t._id !== id)));
    };

    return <>
        <div className="row p-3 bg-success text-light">
            <h1>Todo Project with MERN + AI</h1>
        </div>

        
        {/* ------------- AI INPUT SECTION ---------------- */}
        <div className="mt-4">
            <h4>AI Add Task (Natural Language)</h4>

            <div className="d-flex gap-2">
                <input
                    placeholder="Eg: Buy groceries tomorrow at 6pm"
                    className="form-control"
                    value={nlInput}
                    onChange={(e) => setNlInput(e.target.value)}
                />

                <button className="btn btn-primary" onClick={handleAIParse}>
                    AI Add
                </button>
            </div>
        </div>


        {/* ------------- NORMAL MANUAL INPUT ------------- */}
        <div className="row mt-4">
            <h4>Manual Add Item</h4>

            <div className="form-group d-flex gap-2">
                <input placeholder="Title"
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                    className="form-control" />

                <input placeholder="Description"
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                    className="form-control" />

                <button className="btn btn-dark" onClick={handleSubmit}>
                    Submit
                </button>
            </div>
        </div>


        {/* ------------------- TASK LIST ------------------ */}
        <div className="row mt-4">
            <h3>Tasks</h3>
            <div className="col-md-6">
                <ul className="list-group">
                    {
                        todos.map(item =>
                            <li key={item._id}
                                className="list-group-item bg-info d-flex justify-content-between align-items-center my-2">

                                <div className="d-flex flex-column me-2">

                                    {editId !== item._id ? (
                                        <>
                                            <span className="fw-bold">{item.title}</span>
                                            <span>{item.description}</span>
                                        </>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <input className="form-control"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)} />

                                            <input className="form-control"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)} />
                                        </div>
                                    )}
                                </div>


                                {/* IMPROVE BUTTON */}
                                <button className="btn btn-secondary me-2"
                                    onClick={() => improveTask(item)}>
                                    Improve
                                </button>


                                <div className="d-flex gap-2">
                                    {
                                        editId === item._id ? (
                                            <button className="btn btn-warning" onClick={handleUpdate}>Update</button>
                                        ) : (
                                            <button className="btn btn-warning" onClick={() => handleEdit(item)}>Edit</button>
                                        )
                                    }

                                    <button className="btn btn-danger" onClick={() => handleDelete(item._id)}>
                                        Delete
                                    </button>
                                </div>

                            </li>
                        )
                    }
                </ul>
            </div>
        </div>
    </>
}
