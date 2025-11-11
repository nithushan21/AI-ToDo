import React, { useState, useEffect } from 'react';
export default function Todo() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [todos, setTodos] = useState([]);
    const [message, setMessage] = useState("");
    const [editId, setEditId] = useState(-1);
    const apiUrl = "http://localhost:8000"

    //edit
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");

    const handleSubmit = () => {
        setError("");
        //check inputs
        if (title.trim() !== '' && description.trim() !== '') {
            fetch(apiUrl + '/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description }),
            }).then((res) => {
                if (res.ok) {
                    //add item
                    setTodos([...todos, { title, description }]);
                    setTitle("");
                    setDescription("");
                    setMessage('Item added successfully');
                    setTimeout(() => {
                        setMessage('');
                    }, 3000);
                } else {
                    //set error
                    setError('Failed to add todo item')
                }

            }).catch(() => {
                setError('Failed to add todo item');
            });
        }
    }

    useEffect(() => {
        getItems();
    }, [])
    const getItems = () => {
        fetch(apiUrl + '/todos')
            .then((res) => res.json())
            .then((res) => {
                setTodos(res);
            })
    }

    const handleEdit = (item) => {
        setEditId(item._id);
        setEditTitle(item.title);
        setEditDescription(item.description);
    }

    const handleUpdate = () => {
        setError("");
        //check inputs
        if (editTitle.trim() !== '' && editDescription.trim() !== '') {
            fetch(apiUrl + "/todos/" + editId, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: editTitle, description: editDescription }),
            }).then((res) => {
                if (res.ok) {
                    //update item
                    const updatedTodos = todos.map((item) => {
                        if (item._id === editId) {
                            item.title = editTitle;
                            item.description = editDescription;
                        }
                        return item;
                    })
                    setTodos(updatedTodos);
                    setEditTitle("");
                    setEditDescription("");
                    setMessage('Item updated successfully');
                    setTimeout(() => {
                        setMessage('');
                    }, 3000);
                    setEditId(-1);
                } else {
                    //set error
                    setError('Failed to update todo item')
                }

            }).catch(() => {
                setError('Failed to add todo item');
            });
        }
    }

    const handleEditCancel = () => {
        setEditId(-1);
    }

    const handleDelete = (id) => {
        if (window.confirm("Are you sure to delete this item?")) {
            fetch(apiUrl + "/todos/" + id, {
                method: 'DELETE',
            }).then((res) => {
                if (res.ok) {
                    //delete item
                    const updatedTodos = todos.filter((item) => item._id !== id);
                    setTodos(updatedTodos);
                }
            })
        }
    }

    return <>
        <div className="row p-3 bg-success text-light">
            <h1>Todo Project with MERN stack</h1>
        </div>
        <div className="row mt-3">
            <h3>Todo Add Item</h3>
            {message && <p className="text-success">{message}</p>}
            <div className="form-group d-flex gap-2">
                <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} value={title} className="form-control" type="text"></input>
                <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} value={description} className="form-control" type="text"></input>
                <button className="btn btn-dark" onClick={handleSubmit}> Submit   </button>
            </div>
            {error && <p className="text-danger">{error}</p>}
        </div>
        <div className="row mt-3">
            <h3>Tasks</h3>
            <div className="col-md-6">
            <ul className="list-group">
                {
                    todos.map((item) =>
                        <li className="list-group-item bg-info d-flex justify-content-between align-items-center my-2">
                            <div className='d-flex flex-column me-2'>
                                {
                                    editId == -1 || editId !== item._id ? <>
                                        <span className='fw-bold'>{item.title}</span>
                                        <span>{item.description}</span>
                                    </> : <>
                                        <div className="form-group d-flex gap-2">
                                            <input placeholder="Title" onChange={(e) => setEditTitle(e.target.value)} value={editTitle} className="form-control" type="text"></input>
                                            <input placeholder="Description" onChange={(e) => setEditDescription(e.target.value)} value={editDescription} className="form-control" type="text"></input>
                                        </div>
                                    </>
                                }
                                </div>

                                <div className="d-flex gap-2">
                                    {editId == -1 ? <button className='btn btn-warning' onClick={() => handleEdit(item)}>Edit</button> : <button className='btn btn-warning mx-2' onClick={handleUpdate}>Update</button>}
                                    {editId == -1 ? <button className='btn btn-danger' onClick={() => handleDelete(item._id)}>Delete</button> :
                                    <button className='btn btn-danger' onClick={handleEditCancel}>Cancel</button> }
                                </div>
                            
                        </li>
                    )
                }
            </ul>
            </div>
        </div>
    </>
}
