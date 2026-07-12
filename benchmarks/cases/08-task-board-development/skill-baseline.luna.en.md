# Pocket Queue Development Guide

Pocket Queue is a local-only React single-page task board. Users manage tasks across three columns—`backlog`, `doing`, and `done`—with no server, authentication, or synchronization.

The implementation should keep three concerns separate:

- React components handle rendering and user input.
- A reducer performs every board-state update.
- A storage module validates and persists data in `localStorage`.

## Project setup

Create a Vite React TypeScript project and pin the required major versions:

```bash
npm create vite@latest pocket-queue -- --template react-ts
cd pocket-queue
npm install react@^19 react-dom@^19
npm install -D vite@^7 vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Enable strict TypeScript checking in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

Add test scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

A suitable structure is:

```text
src/
  domain/
    task.ts
    reducer.ts
  persistence/
    storage.ts
  App.tsx
  main.tsx
  test/
    setup.ts
```

## Domain types

Use a string union for column identifiers so invalid statuses cannot be passed accidentally.

`src/domain/task.ts`

```ts
export const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
] as const;

export type ColumnId = (typeof COLUMNS)[number]["id"];

export type Task = {
  id: string;
  title: string;
  status: ColumnId;
  createdAt: string;
  updatedAt: string;
};

export function isValidTitle(title: string): boolean {
  const length = Array.from(title.trim()).length;
  return length >= 1 && length <= 80;
}

export function createTask(
  title: string,
  now = new Date(),
  id = crypto.randomUUID(),
): Task {
  const normalizedTitle = title.trim();

  if (!isValidTitle(normalizedTitle)) {
    throw new Error("Task titles must contain 1–80 characters.");
  }

  const timestamp = now.toISOString();

  return {
    id,
    title: normalizedTitle,
    status: "backlog",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
```

`createdAt` and `updatedAt` are stored as ISO timestamp strings. The UI creates UUIDs with `crypto.randomUUID()`.

## Reducer-based state updates

The reducer is the only place that changes the task collection. The action carries timestamps so the reducer remains deterministic and easy to test.

`src/domain/reducer.ts`

```ts
import type { ColumnId, Task } from "./task";
import { isValidTitle } from "./task";

export type BoardState = {
  tasks: Task[];
  warning?: string;
  dirty: boolean;
};

export type BoardAction =
  | {
      type: "taskAdded";
      task: Task;
    }
  | {
      type: "taskTitleUpdated";
      id: string;
      title: string;
      updatedAt: string;
    }
  | {
      type: "taskMoved";
      id: string;
      status: ColumnId;
      updatedAt: string;
    }
  | {
      type: "taskDeleted";
      id: string;
    };

function changed(state: BoardState, tasks: Task[]): BoardState {
  return {
    tasks,
    warning: undefined,
    dirty: true,
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "taskAdded": {
      if (!isValidTitle(action.task.title)) {
        return state;
      }

      const task = {
        ...action.task,
        title: action.task.title.trim(),
      };

      return changed(state, [...state.tasks, task]);
    }

    case "taskTitleUpdated": {
      const title = action.title.trim();

      if (!isValidTitle(title)) {
        return state;
      }

      const task = state.tasks.find((item) => item.id === action.id);

      if (!task || task.title === title) {
        return state;
      }

      const tasks = state.tasks.map((item) =>
        item.id === action.id
          ? { ...item, title, updatedAt: action.updatedAt }
          : item,
      );

      return changed(state, tasks);
    }

    case "taskMoved": {
      const task = state.tasks.find((item) => item.id === action.id);

      if (!task || task.status === action.status) {
        return state;
      }

      const tasks = state.tasks.map((item) =>
        item.id === action.id
          ? {
              ...item,
              status: action.status,
              updatedAt: action.updatedAt,
            }
          : item,
      );

      return changed(state, tasks);
    }

    case "taskDeleted": {
      const tasks = state.tasks.filter((item) => item.id !== action.id);

      if (tasks.length === state.tasks.length) {
        return state;
      }

      return changed(state, tasks);
    }
  }
}
```

The `dirty` flag distinguishes an untouched board loaded from storage from a board changed by the user. This prevents an invalid stored value from being overwritten during startup.

## Persistence and validation

Store a versioned object under `pocket-queue:v1`:

```json
{
  "version": 1,
  "tasks": []
}
```

Keep all `localStorage` access and runtime validation in one module.

`src/persistence/storage.ts`

```ts
import type { ColumnId, Task } from "../domain/task";
import { isValidTitle } from "../domain/task";

export const STORAGE_KEY = "pocket-queue:v1";

export type StoredBoard = {
  version: 1;
  tasks: Task[];
};

export type LoadBoardResult = {
  tasks: Task[];
  warning?: string;
};

const INVALID_DATA_WARNING =
  "Saved Pocket Queue data was invalid, so the board started empty.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COLUMN_IDS: readonly ColumnId[] = ["backlog", "doing", "done"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === "string" && COLUMN_IDS.includes(value as ColumnId);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    UUID_PATTERN.test(value.id) &&
    typeof value.title === "string" &&
    isValidTitle(value.title) &&
    isColumnId(value.status) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  );
}

export function isStoredBoard(value: unknown): value is StoredBoard {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask)
  );
}

export function loadBoard(): LoadBoardResult {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return { tasks: [] };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isStoredBoard(parsed)) {
      return {
        tasks: [],
        warning: INVALID_DATA_WARNING,
      };
    }

    return { tasks: parsed.tasks };
  } catch {
    return {
      tasks: [],
      warning: INVALID_DATA_WARNING,
    };
  }
}

export function saveBoard(tasks: Task[]): void {
  const value: StoredBoard = {
    version: 1,
    tasks,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
```

Invalid JSON and invalid object shapes both produce an empty board with a warning. The invalid value remains untouched until a reducer action changes the board.

## React application wiring

`src/App.tsx`

```tsx
import {
  useEffect,
  useReducer,
  useState,
  type FormEvent,
} from "react";
import {
  COLUMNS,
  createTask,
  isValidTitle,
  type ColumnId,
  type Task,
} from "./domain/task";
import {
  boardReducer,
  type BoardState,
} from "./domain/reducer";
import { loadBoard, saveBoard } from "./persistence/storage";

function initializeBoard(): BoardState {
  const loaded = loadBoard();

  return {
    tasks: loaded.tasks,
    warning: loaded.warning,
    dirty: false,
  };
}

export default function App() {
  const [state, dispatch] = useReducer(
    boardReducer,
    undefined,
    initializeBoard,
  );
  const [filter, setFilter] = useState<ColumnId | "all">("all");
  const [title, setTitle] = useState("");
  const [formError, setFormError] = useState<string>();

  useEffect(() => {
    if (state.dirty) {
      saveBoard(state.tasks);
    }
  }, [state.dirty, state.tasks]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidTitle(title)) {
      setFormError("Enter a task title between 1 and 80 characters.");
      return;
    }

    dispatch({
      type: "taskAdded",
      task: createTask(title),
    });

    setTitle("");
    setFormError(undefined);
  }

  function updateTitle(id: string, nextTitle: string) {
    dispatch({
      type: "taskTitleUpdated",
      id,
      title: nextTitle,
      updatedAt: new Date().toISOString(),
    });
  }

  function moveTask(id: string, status: ColumnId) {
    dispatch({
      type: "taskMoved",
      id,
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  function deleteTask(id: string) {
    dispatch({ type: "taskDeleted", id });
  }

  const visibleTasks = state.tasks.filter(
    (task) => filter === "all" || task.status === filter,
  );

  return (
    <main>
      <h1>Pocket Queue</h1>

      {state.warning && <div role="alert">{state.warning}</div>}

      <form onSubmit={addTask}>
        <label htmlFor="new-task-title">Task title</label>
        <input
          id="new-task-title"
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
        <button type="submit">Add task</button>
        {formError && <p role="alert">{formError}</p>}
      </form>

      <label htmlFor="column-filter">Filter by column</label>
      <select
        id="column-filter"
        value={filter}
        onChange={(event) =>
          setFilter(event.currentTarget.value as ColumnId | "all")
        }
      >
        <option value="all">All columns</option>
        {COLUMNS.map((column) => (
          <option key={column.id} value={column.id}>
            {column.label}
          </option>
        ))}
      </select>

      {COLUMNS.map((column) => {
        const tasks =
          filter === "all" || filter === column.id
            ? visibleTasks.filter((task) => task.status === column.id)
            : [];

        return (
          <section
            key={column.id}
            aria-labelledby={`column-${column.id}`}
          >
            <h2 id={`column-${column.id}`}>{column.label}</h2>

            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={updateTitle}
                onMove={moveTask}
                onDelete={deleteTask}
              />
            ))}
          </section>
        );
      })}
    </main>
  );
}

type TaskCardProps = {
  task: Task;
  onEdit: (id: string, title: string) => void;
  onMove: (id: string, status: ColumnId) => void;
  onDelete: (id: string) => void;
};

function TaskCard({
  task,
  onEdit,
  onMove,
  onDelete,
}: TaskCardProps) {
  const [draft, setDraft] = useState(task.title);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setDraft(task.title);
  }, [task.title]);

  function submitTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidTitle(draft)) {
      setError("Enter a task title between 1 and 80 characters.");
      return;
    }

    onEdit(task.id, draft);
    setError(undefined);
  }

  return (
    <article>
      <form onSubmit={submitTitle}>
        <label htmlFor={`title-${task.id}`}>Title</label>
        <input
          id={`title-${task.id}`}
          value={draft}
          maxLength={80}
          onChange={(event) => setDraft(event.currentTarget.value)}
        />
        <button type="submit">Save title</button>
        {error && <p role="alert">{error}</p>}
      </form>

      <label htmlFor={`move-${task.id}`}>
        Move “{task.title}”
      </label>
      <select
        id={`move-${task.id}`}
        value={task.status}
        onChange={(event) =>
          onMove(task.id, event.currentTarget.value as ColumnId)
        }
      >
        {COLUMNS.map((column) => (
          <option key={column.id} value={column.id}>
            {column.label}
          </option>
        ))}
      </select>

      <button type="button" onClick={() => onDelete(task.id)}>
        Delete
      </button>
    </article>
  );
}
```

The native `<select>` provides keyboard-accessible movement through Tab, arrow keys, and Enter. Dragging is not required, and any future drag interaction must remain an optional enhancement.

Filtering is view state, so it does not set `dirty` and does not trigger persistence.

## Testing

Configure Vitest with a browser-like environment.

`vite.config.ts`

```ts
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

`src/test/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
```

### Reducer tests

`src/domain/reducer.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { boardReducer, type BoardState } from "./reducer";
import type { Task } from "./task";

const task: Task = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Write docs",
  status: "backlog",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

const initialState: BoardState = {
  tasks: [],
  dirty: false,
};

describe("boardReducer", () => {
  it("adds a task and marks the board dirty", () => {
    const next = boardReducer(initialState, {
      type: "taskAdded",
      task,
    });

    expect(next.tasks).toEqual([task]);
    expect(next.dirty).toBe(true);
  });

  it("moves a task and updates its timestamp", () => {
    const next = boardReducer(
      {
        tasks: [task],
        dirty: false,
      },
      {
        type: "taskMoved",
        id: task.id,
        status: "doing",
        updatedAt: "2026-07-12T01:00:00.000Z",
      },
    );

    expect(next.tasks[0]).toMatchObject({
      status: "doing",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });
  });
});
```

### Stored-data validation tests

`src/persistence/storage.test.ts`

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  isStoredBoard,
  loadBoard,
  STORAGE_KEY,
} from "./storage";

const validTask = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "Write docs",
  status: "backlog",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

beforeEach(() => {
  localStorage.clear();
});

describe("stored board validation", () => {
  it("accepts the required shape", () => {
    expect(
      isStoredBoard({
        version: 1,
        tasks: [validTask],
      }),
    ).toBe(true);
  });

  it("rejects an invalid task shape", () => {
    expect(
      isStoredBoard({
        version: 1,
        tasks: [{ title: "Missing required fields" }],
      }),
    ).toBe(false);
  });

  it("starts empty when JSON is invalid", () => {
    localStorage.setItem(STORAGE_KEY, "{not-json");

    const result = loadBoard();

    expect(result.tasks).toEqual([]);
    expect(result.warning).toBeTruthy();
  });

  it("starts empty when the stored object is invalid", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, tasks: "not-an-array" }),
    );

    const result = loadBoard();

    expect(result.tasks).toEqual([]);
    expect(result.warning).toBeTruthy();
  });
});
```

### User-flow tests

`src/App.test.tsx`

```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { STORAGE_KEY } from "./persistence/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("Pocket Queue user flows", () => {
  it("adds a task to Backlog and persists it", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: "Task title" }),
      "Write docs",
    );
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(
      screen.getByRole("region", { name: "Backlog" }),
    ).toHaveTextContent("Write docs");

    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEY) ?? ""),
    ).toMatchObject({
      version: 1,
      tasks: [
        {
          title: "Write docs",
          status: "backlog",
        },
      ],
    });
  });

  it("moves a task with the keyboard-accessible column control", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: "Task title" }),
      "Move me",
    );
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Move “Move me”" }),
      "doing",
    );

    expect(
      screen.getByRole("region", { name: "Doing" }),
    ).toHaveTextContent("Move me");

    expect(
      screen.getByRole("region", { name: "Backlog" }),
    ).not.toHaveTextContent("Move me");
  });
});
```

Run the checks with:

```bash
npm test
npm run build
```

The finished version should provide task creation, title editing, deletion, column movement through a keyboard-accessible control, column filtering, validated startup loading, and persistence after every board-state change.