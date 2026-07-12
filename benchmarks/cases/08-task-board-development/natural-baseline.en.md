# Pocket Queue development guide

Pocket Queue is a local-only React task board. Its persistent domain state is an array of tasks; UI filtering and warnings remain in memory.

## 1. Create the project

```bash
npm create vite@latest pocket-queue -- --template react-ts
cd pocket-queue
npm install

npm install -D \
  vitest \
  jsdom \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom
```

Enable strict mode in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

Add test configuration to `vite.config.ts`:

```ts
/// <reference types="vitest/config" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

Add a test script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

A suitable source layout is:

```text
src/
  App.tsx
  board.ts
  storage.ts
  test/
    setup.ts
  App.test.tsx
  board.test.ts
  storage.test.ts
```

## 2. Domain types and reducer

Keep IDs and timestamps outside the reducer so the reducer stays deterministic and easy to test.

```ts
// src/board.ts

export const TASK_STATUSES = ["backlog", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskFilter = TaskStatus | "all";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BoardState {
  tasks: Task[];
  filter: TaskFilter;
  warning: string | null;

  // Starts at zero and changes only when persistent task data changes.
  // This prevents the initial effect from overwriting invalid stored data.
  persistenceRevision: number;
}

export type BoardAction =
  | {
      type: "taskAdded";
      task: Task;
    }
  | {
      type: "taskRenamed";
      id: string;
      title: string;
      updatedAt: string;
    }
  | {
      type: "taskMoved";
      id: string;
      status: TaskStatus;
      updatedAt: string;
    }
  | {
      type: "taskDeleted";
      id: string;
    }
  | {
      type: "filterChanged";
      filter: TaskFilter;
    }
  | {
      type: "warningChanged";
      warning: string | null;
    };

export function isValidTitle(title: string): boolean {
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 80;
}

function persistentUpdate(
  state: BoardState,
  tasks: Task[],
): BoardState {
  return {
    ...state,
    tasks,
    persistenceRevision: state.persistenceRevision + 1,
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "taskAdded": {
      if (
        !isValidTitle(action.task.title) ||
        state.tasks.some((task) => task.id === action.task.id)
      ) {
        return state;
      }

      return persistentUpdate(state, [
        ...state.tasks,
        {
          ...action.task,
          title: action.task.title.trim(),
        },
      ]);
    }

    case "taskRenamed": {
      const title = action.title.trim();
      if (!isValidTitle(title)) {
        return state;
      }

      const current = state.tasks.find((task) => task.id === action.id);
      if (!current || current.title === title) {
        return state;
      }

      return persistentUpdate(
        state,
        state.tasks.map((task) =>
          task.id === action.id
            ? { ...task, title, updatedAt: action.updatedAt }
            : task,
        ),
      );
    }

    case "taskMoved": {
      const current = state.tasks.find((task) => task.id === action.id);
      if (!current || current.status === action.status) {
        return state;
      }

      return persistentUpdate(
        state,
        state.tasks.map((task) =>
          task.id === action.id
            ? {
                ...task,
                status: action.status,
                updatedAt: action.updatedAt,
              }
            : task,
        ),
      );
    }

    case "taskDeleted": {
      if (!state.tasks.some((task) => task.id === action.id)) {
        return state;
      }

      return persistentUpdate(
        state,
        state.tasks.filter((task) => task.id !== action.id),
      );
    }

    case "filterChanged":
      return { ...state, filter: action.filter };

    case "warningChanged":
      return state.warning === action.warning
        ? state
        : { ...state, warning: action.warning };
  }
}
```

Filtering should be derived rather than stored as another task collection:

```ts
export function selectVisibleTasks(state: BoardState): Task[] {
  return state.filter === "all"
    ? state.tasks
    : state.tasks.filter((task) => task.status === state.filter);
}
```

## 3. Validation and localStorage

Treat localStorage as untrusted input. Validate every field before using stored data.

```ts
// src/storage.ts

import {
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from "./board";

export const STORAGE_KEY = "pocket-queue:v1";

export type LoadResult =
  | { ok: true; tasks: Task[] }
  | { ok: false; tasks: []; message: string };

export type SaveResult =
  | { ok: true }
  | { ok: false; message: string };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    TASK_STATUSES.some((status) => status === value)
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}

export function isStoredTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    uuidPattern.test(value.id) &&
    typeof value.title === "string" &&
    value.title.trim().length >= 1 &&
    value.title.trim().length <= 80 &&
    isStatus(value.status) &&
    isIsoDate(value.createdAt) &&
    isIsoDate(value.updatedAt)
  );
}

export function isStoredTaskList(value: unknown): value is Task[] {
  if (!Array.isArray(value) || !value.every(isStoredTask)) {
    return false;
  }

  return new Set(value.map((task) => task.id)).size === value.length;
}

export function loadTasks(
  storage: Storage = window.localStorage,
): LoadResult {
  let raw: string | null;

  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      ok: false,
      tasks: [],
      message: "Pocket Queue could not access saved tasks.",
    };
  }

  if (raw === null) {
    return { ok: true, tasks: [] };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isStoredTaskList(parsed)) {
      return {
        ok: false,
        tasks: [],
        message:
          "Saved task data is invalid. An empty board has been opened.",
      };
    }

    return { ok: true, tasks: parsed };
  } catch {
    return {
      ok: false,
      tasks: [],
      message:
        "Saved task data is not valid JSON. An empty board has been opened.",
    };
  }
}

export function saveTasks(
  tasks: Task[],
  storage: Storage = window.localStorage,
): SaveResult {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Your latest changes could not be saved.",
    };
  }
}
```

Important behavior:

- Missing data produces an ordinary empty board.
- Invalid data produces an empty board plus a warning.
- Loading never writes to localStorage.
- The invalid value remains untouched until a task mutation increments `persistenceRevision`.
- Changing only the filter does not rewrite stored task data.

## 4. React integration

```tsx
// src/App.tsx

import {
  useEffect,
  useReducer,
  useState,
  type FormEvent,
} from "react";
import {
  TASK_STATUSES,
  boardReducer,
  isValidTitle,
  type BoardState,
  type Task,
  type TaskStatus,
} from "./board";
import { loadTasks, saveTasks } from "./storage";

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  doing: "Doing",
  done: "Done",
};

function createInitialState(): BoardState {
  const loaded = loadTasks();

  return {
    tasks: loaded.tasks,
    filter: "all",
    warning: loaded.ok ? null : loaded.message,
    persistenceRevision: 0,
  };
}

export default function App() {
  const [state, dispatch] = useReducer(
    boardReducer,
    undefined,
    createInitialState,
  );
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (state.persistenceRevision === 0) {
      return;
    }

    const result = saveTasks(state.tasks);

    dispatch({
      type: "warningChanged",
      warning: result.ok ? null : result.message,
    });
  }, [state.persistenceRevision, state.tasks]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = newTitle.trim();
    if (!isValidTitle(title)) {
      return;
    }

    const timestamp = new Date().toISOString();

    const task: Task = {
      id: crypto.randomUUID(),
      title,
      status: "backlog",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    dispatch({ type: "taskAdded", task });
    setNewTitle("");
  }

  const visibleStatuses =
    state.filter === "all" ? TASK_STATUSES : [state.filter];

  return (
    <main>
      <h1>Pocket Queue</h1>

      {state.warning && <p role="alert">{state.warning}</p>}

      <form onSubmit={addTask}>
        <label htmlFor="new-task">New task</label>
        <input
          id="new-task"
          value={newTitle}
          maxLength={80}
          required
          onChange={(event) => setNewTitle(event.target.value)}
        />
        <button type="submit">Add task</button>
      </form>

      <label htmlFor="column-filter">Filter by column</label>
      <select
        id="column-filter"
        value={state.filter}
        onChange={(event) => {
          dispatch({
            type: "filterChanged",
            filter: event.target.value as BoardState["filter"],
          });
        }}
      >
        <option value="all">All columns</option>
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>

      <div className="board">
        {visibleStatuses.map((status) => (
          <section
            key={status}
            aria-label={STATUS_LABELS[status]}
          >
            <h2>{STATUS_LABELS[status]}</h2>

            {state.tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onRename={(title) => {
                    dispatch({
                      type: "taskRenamed",
                      id: task.id,
                      title,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  onMove={(nextStatus) => {
                    dispatch({
                      type: "taskMoved",
                      id: task.id,
                      status: nextStatus,
                      updatedAt: new Date().toISOString(),
                    });
                  }}
                  onDelete={() => {
                    dispatch({
                      type: "taskDeleted",
                      id: task.id,
                    });
                  }}
                />
              ))}
          </section>
        ))}
      </div>
    </main>
  );
}

interface TaskCardProps {
  task: Task;
  onRename(title: string): void;
  onMove(status: TaskStatus): void;
  onDelete(): void;
}

function TaskCard({
  task,
  onRename,
  onMove,
  onDelete,
}: TaskCardProps) {
  const [title, setTitle] = useState(task.title);

  function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isValidTitle(title)) {
      onRename(title);
    }
  }

  return (
    <article>
      <form onSubmit={saveTitle}>
        <label>
          Task title
          <input
            value={title}
            maxLength={80}
            required
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <button type="submit">Save title</button>
      </form>

      <label>
        Move {task.title} to
        <select
          aria-label={`Move ${task.title}`}
          value={task.status}
          onChange={(event) => {
            onMove(event.target.value as TaskStatus);
          }}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <button type="button" onClick={onDelete}>
        Delete {task.title}
      </button>
    </article>
  );
}
```

The move control is a native `<select>`, so moving tasks works with a keyboard and screen reader. Dragging may be added later without becoming the only interaction, but it is unnecessary for this version.

## 5. Reducer tests

```ts
// src/board.test.ts

import { describe, expect, it } from "vitest";
import {
  boardReducer,
  type BoardState,
  type Task,
} from "./board";

const initialState: BoardState = {
  tasks: [],
  filter: "all",
  warning: null,
  persistenceRevision: 0,
};

const task: Task = {
  id: "62dbd7aa-fdd4-4a09-b295-657262c042d1",
  title: "Buy milk",
  status: "backlog",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

describe("boardReducer", () => {
  it("adds a task", () => {
    const state = boardReducer(initialState, {
      type: "taskAdded",
      task,
    });

    expect(state.tasks).toEqual([task]);
    expect(state.persistenceRevision).toBe(1);
  });

  it("moves a task and updates its timestamp", () => {
    const state = boardReducer(
      { ...initialState, tasks: [task] },
      {
        type: "taskMoved",
        id: task.id,
        status: "doing",
        updatedAt: "2026-07-12T01:00:00.000Z",
      },
    );

    expect(state.tasks[0]).toMatchObject({
      status: "doing",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });
    expect(state.persistenceRevision).toBe(1);
  });

  it("does not mutate state for an invalid title", () => {
    const state = boardReducer(initialState, {
      type: "taskAdded",
      task: { ...task, title: " ".repeat(3) },
    });

    expect(state).toBe(initialState);
  });

  it("does not mark filter changes for persistence", () => {
    const state = boardReducer(initialState, {
      type: "filterChanged",
      filter: "done",
    });

    expect(state.filter).toBe("done");
    expect(state.persistenceRevision).toBe(0);
  });
});
```

## 6. Storage tests

```ts
// src/storage.test.ts

import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  loadTasks,
  saveTasks,
} from "./storage";
import type { Task } from "./board";

const validTask: Task = {
  id: "62dbd7aa-fdd4-4a09-b295-657262c042d1",
  title: "Buy milk",
  status: "backlog",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

beforeEach(() => {
  localStorage.clear();
});

describe("stored-data validation", () => {
  it("loads valid tasks", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([validTask]));

    expect(loadTasks()).toEqual({
      ok: true,
      tasks: [validTask],
    });
  });

  it("rejects invalid JSON without overwriting it", () => {
    const invalidValue = "{broken";
    localStorage.setItem(STORAGE_KEY, invalidValue);

    const result = loadTasks();

    expect(result.ok).toBe(false);
    expect(result.tasks).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(invalidValue);
  });

  it("rejects data with missing task fields", () => {
    const invalidValue = JSON.stringify([
      {
        id: validTask.id,
        title: validTask.title,
      },
    ]);

    localStorage.setItem(STORAGE_KEY, invalidValue);

    expect(loadTasks().ok).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(invalidValue);
  });

  it("saves valid task data", () => {
    expect(saveTasks([validTask])).toEqual({ ok: true });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([
      validTask,
    ]);
  });
});
```

## 7. User-flow tests

```tsx
// src/App.test.tsx

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { STORAGE_KEY } from "./storage";

beforeEach(() => {
  localStorage.clear();

  vi.stubGlobal("crypto", {
    randomUUID: () =>
      "62dbd7aa-fdd4-4a09-b295-657262c042d1",
  });
});

describe("Pocket Queue", () => {
  it("adds a task to the backlog and persists it", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByLabelText("New task"),
      "Buy milk",
    );
    await user.click(
      screen.getByRole("button", { name: "Add task" }),
    );

    const backlog = screen.getByRole("region", {
      name: "Backlog",
    });

    expect(
      within(backlog).getByDisplayValue("Buy milk"),
    ).toBeInTheDocument();

    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "[]",
      );

      expect(stored).toEqual([
        expect.objectContaining({
          title: "Buy milk",
          status: "backlog",
        }),
      ]);
    });
  });

  it("moves a task using the keyboard-accessible control", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByLabelText("New task"),
      "Buy milk",
    );
    await user.click(
      screen.getByRole("button", { name: "Add task" }),
    );

    await user.selectOptions(
      screen.getByLabelText("Move Buy milk"),
      "doing",
    );

    const doing = screen.getByRole("region", {
      name: "Doing",
    });

    expect(
      within(doing).getByDisplayValue("Buy milk"),
    ).toBeInTheDocument();
  });

  it("preserves invalid stored data until a task changes", async () => {
    const invalidValue = "{broken";
    localStorage.setItem(STORAGE_KEY, invalidValue);

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /not valid JSON/i,
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBe(invalidValue);

    await user.type(
      screen.getByLabelText("New task"),
      "Replace invalid data",
    );
    await user.click(
      screen.getByRole("button", { name: "Add task" }),
    );

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).not.toBe(
        invalidValue,
      );
    });
  });
});
```

Run the suite with:

```bash
npm test
```

This keeps version one deliberately narrow: task CRUD, movement, filtering, local persistence, invalid-data recovery, and the requested tests—without server APIs, authentication, synchronization, or drag-and-drop dependencies.