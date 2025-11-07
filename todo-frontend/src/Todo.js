import React, { useState, useEffect } from 'react';
export default function Todo(){
    const [title, setTitle]= useState("");
    const [description, setDescription]= useState("");
    const [error, setError]= useState("");
    const [todos, setTodos]= useState([]);
    const [message, setMessage]= useState("");
    const apiUrl = "http://localhost:8000"

    const handleSubmit = () => {
        setError("");
        //check inputs
        if (title.trim() !== '' && description.trim() !== '') {
            fetch(apiUrl+'/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description }),
            }).then((res) => {  
                if (res.ok) {
                    //add item
                    setTodos([...todos, {title, description}]);
                    setMessage('Item added successfully');
                    setTimeout(() => {
                        setMessage('');
                    }, 3000);
                }else {
                    //set error
                    setError('Failed to add todo item')
                }
                  
              }).catch(() => {
                setError('Failed to add todo item');
              });
        }
    }

    return <>
    <div className="row p-3 bg-success text-light">
        <h1>Todo Project with MERN stack</h1>
    </div>   
    <div className="row">
        <h3>Todo Add Item</h3>
       {message && <p className="text-success">{message}</p>}
        <div className="form-group">
            <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} value={title} className="form-control" type="text"></input>
            <input placeholder="Description" onChange={(e) => setDescription(e.target.value)} value={description} className="form-control" type="text"></input>
            <button className="btn btn-dark" onClick={handleSubmit}> Submit   </button>
        </div>
        {error && <p className="text-danger">{error}</p>}
    </div> 
    <div className="row mt-3">
        <h3>Todo List</h3>
        <ul className="list-group">
            <li className="list-group-item d-flex justify-content-between">
                <span>Item Text</span>
            </li>
            <div>
                <div>
                    <button>Edit</button>
                    <button>Delete</button>
                </div>
            </div>
        </ul>
    </div>
</>
}