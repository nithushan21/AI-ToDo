import React, { useState } from "react";
import Todo from "./Todo";
import Login from "./Login";
import Register from "./Register";
import { getToken, logout } from "./auth";

function App() {
  const [page, setPage] = useState(getToken() ? "todo" : "login");

  const handleLogout = () => {
    logout();
    setPage("login");
  };

  return (
    <div>
      {page === "login" && (
        <Login
          onLogin={() => setPage("todo")}
          goRegister={() => setPage("register")}
        />
      )}
      {page === "register" && <Register goLogin={() => setPage("login")} />}

      {page === "todo" && (
        <>
          <button className="btn btn-danger m-3" onClick={handleLogout}>
            Logout
          </button>
          <Todo />
        </>
      )}
    </div>
  );
}

export default App;
