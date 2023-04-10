const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// get todo

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let getTodoDetailsQuery = "";
  let data = null;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoDetailsQuery = `
            SELECT * 
                FROM todo
            WHERE 
                todo LIKE '%${search_q}%' 
                AND  status = '${status}'
                AND priority = '${priority}'
            `;
      break;
    case hasPriorityStatus(request.query):
      getTodoDetailsQuery = `
            SELECT * 
                FROM todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}'
            `;
      break;
    case hasPriorityProperty(request.query):
      getTodoDetailsQuery = `
            SELECT * 
                FROM todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND  priority = '${priority}'
            `;
      break;
    default:
      getTodoDetailsQuery = `
            SELECT * 
                FROM todo
            WHERE 
                todo LIKE '%${search_q}%'
            `;
  }
  const todoDetails = await db.all(getTodoDetailsQuery);
  response.send(todoDetails);
});

//get specific todo

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  //   const { search_q = "", status = "", priority = "" } = request.query;
  const getTodoDetailsQuery = `
  SELECT *
    FROM todo
  WHERE
    id = ${todoId}
  `;
  const todoDetails = await db.get(getTodoDetailsQuery);
  response.send(todoDetails);
});

// add todo

app.post("/todos/", async (request, response) => {
  const todoDetail = request.body;
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
  INSERT INTO todo (id,todo,priority,status)
  VALUES
    (
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    )
  `;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//update todo

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const updateDetails = request.body;
  let updatedColumn = "";
  switch (true) {
    case updateDetails.status !== undefined:
      updatedColumn = "Status";
      break;
    case updateDetails.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case updateDetails.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }

  const previousTodoQuery = `
  SELECT *
    FROM todo 
  WHERE 
    id = ${todoId};
  `;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    priority = previousTodo.priority,
    status = previousTodo.status,
    todo = previousTodo.todo,
  } = updateDetails;

  const updateTodoQuery = `
  UPDATE todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE
    id = ${todoId}
  `;
  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

// delete todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE
        id = ${todoId}
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
