# Pocket Queue Development Guide

Pocket Queue is a local-only task board built with React 19, Vite 7, and TypeScript in strict mode. It has three columns—Backlog, Doing, and Done—and stores all data in the browser. There is no server, authentication, or synchronization.

This guide focuses on the state model, reducer, persistence boundary, keyboard-accessible movement, and required tests.

## Project setup

Create a Vite React project and add the test dependencies:

```sh
npm create vite@latest pocket-queue -- --template react-ts
cd pocket-queue
npm install
npm install --save-dev vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Keep TypeScript strict mode enabled in the generated configuration. Add a test script to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest"
  }
}
```

A small source layout is sufficient:

```text
src/
  components/
    Board.tsx
    TaskCard.tsx
    WarningBanner.tsx
  model/
    tasks.ts
    taskReducer.ts
  persistence/
    taskStorage.ts
  App.tsx
  main.tsx
```

## Data model

Use string literal unions for column names so that invalid statuses are rejected at compile time.

```ts
// src/model/tasks.ts

export const TASK_STATUSES = ["backlog", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BoardState {
  tasks: Task[];
}

export const EMPTY_BOARD: BoardState = {
  tasks: [],
};
```

Store timestamps as ISO 8601 strings. This keeps the persisted representation simple and avoids reconstructing `Date` objects after loading.

Task titles must contain between 1 and 80 characters after trimming:

```ts
// src/model/tasks.ts

export function normalizeTitle(value: string): string {
  return value.trim();
}

export function isValidTitle(value: string): boolean {
  const title = normalizeTitle(value);
  return title.length >= 1 && title.length <= 80;
}
```

## Centralized state updates

All task changes should pass through one reducer. Generate IDs and timestamps before dispatching actions so that the reducer remains deterministic and easy to test.

```ts
// src/model/taskReducer.ts

import type { BoardState, Task, TaskStatus } from "./tasks";
import { isValidTitle, normalizeTitle } from "./tasks";

export type TaskAction =
  | { type: "task/added"; task: Task }
  | {
      type: "task/titleChanged";
      id: string;
      title: string;
      updatedAt: string;
    }
  | {
      type: "task/moved";
      id: string;
      status: TaskStatus;
      updatedAt: string;
    }
  | { type: "task/deleted"; id: string };

export function taskReducer(
  state: BoardState,
  action: TaskAction,
): BoardState {
  switch (action.type) {
    case "task/added": {
      if (!isValidTitle(action.task.title)) {
        return state;
      }

      return {
        tasks: [
          ...state.tasks,
          {
            ...action.task,
            title: normalizeTitle(action.task.title),
          },
        ],
      };
    }

    case "task/titleChanged": {
      if (!isValidTitle(action.title)) {
        return state;
      }

      return {
        tasks: state.tasks.map((task) =>
          task.id === action.id
            ? {
                ...task,
                title: normalizeTitle(action.title),
                updatedAt: action.updatedAt,
              }
            : task,
        ),
      };
    }

    case "task/moved": {
      return {
        tasks: state.tasks.map((task) =>
          task.id === action.id && task.status !== action.status
            ? {
                ...task,
                status: action.status,
                updatedAt: action.updatedAt,
              }
            : task,
        ),
      };
    }

    case "task/deleted":
      return {
        tasks: state.tasks.filter((task) => task.id !== action.id),
      };

    default:
      return state;
  }
}
```

Create new tasks at the event boundary:

```ts
const now = new Date().toISOString();

dispatch({
  type: "task/added",
  task: {
    id: crypto.randomUUID(),
    title,
    status: "backlog",
    createdAt: now,
    updatedAt: now,
  },
});
```

The UI should prevent invalid submissions and explain title constraints to the user. Reducer validation remains useful as a final safeguard.

## Stored-data validation

Treat `localStorage` as an untrusted input. Successful JSON parsing alone does not establish that the value has the required shape.

Keep parsing and validation in a module that does not depend on React:

```ts
// src/persistence/taskStorage.ts

import {
  TASK_STATUSES,
  type BoardState,
  type Task,
  type TaskStatus,
} from "../model/tasks";

export const STORAGE_KEY = "pocket-queue:v1";

export type LoadResult =
  | { status: "empty"; state: BoardState }
  | { status: "loaded"; state: BoardState }
  | { status: "invalid"; state: BoardState };

const emptyState = (): BoardState => ({ tasks: [] });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    TASK_STATUSES.some((status) => status === value)
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
}

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    return crypto.randomUUID
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value,
        )
      : false;
  } catch {
    return false;
  }
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isUuid(value.id) &&
    typeof value.title === "string" &&
    value.title === value.title.trim() &&
    value.title.length >= 1 &&
    value.title.length <= 80 &&
    isTaskStatus(value.status) &&
    isIsoDate(value.createdAt) &&
    isIsoDate(value.updatedAt)
  );
}

export function isBoardState(value: unknown): value is BoardState {
  return (
    isRecord(value) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask)
  );
}

export function loadBoard(storage: Storage = localStorage): LoadResult {
  const storedValue = storage.getItem(STORAGE_KEY);

  if (storedValue === null) {
    return { status: "empty", state: emptyState() };
  }

  try {
    const parsed: unknown = JSON.parse(storedValue);

    if (!isBoardState(parsed)) {
      return { status: "invalid", state: emptyState() };
    }

    return { status: "loaded", state: parsed };
  } catch {
    return { status: "invalid", state: emptyState() };
  }
}

export function saveBoard(
  state: BoardState,
  storage: Storage = localStorage,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

The UUID check validates the expected UUID text format. It does not prove that the ID was originally produced by `crypto.randomUUID()`, which cannot be established from stored text.

An optional additional check can reject duplicate task IDs:

```ts
export function hasUniqueTaskIds(state: BoardState): boolean {
  const ids = state.tasks.map((task) => task.id);
  return new Set(ids).size === ids.length;
}
```

If uniqueness is required during loading, include this condition in `isBoardState`.

## Loading without destroying invalid data

The startup sequence must distinguish three conditions:

- No stored value: start with an empty board without a warning.
- Valid stored value: use it as the initial state.
- Invalid stored value: start with an empty board and show a warning.

Loading must not write anything. In particular, mounting the app after an invalid load must not immediately replace the invalid value with an empty board. Save only after the user changes state.

One way to enforce this is to put persistence in the dispatch path:

```tsx
// src/App.tsx

import { useReducer, useState } from "react";
import type { TaskAction } from "./model/taskReducer";
import { taskReducer } from "./model/taskReducer";
import { loadBoard, saveBoard } from "./persistence/taskStorage";
import { Board } from "./components/Board";

const initialLoad = loadBoard();

export default function App() {
  const [state, baseDispatch] = useReducer(
    taskReducer,
    initialLoad.state,
  );
  const [showStorageWarning, setShowStorageWarning] = useState(
    initialLoad.status === "invalid",
  );

  function dispatch(action: TaskAction): void {
    baseDispatch((currentState) => {
      const nextState = taskReducer(currentState, action);

      if (nextState !== currentState) {
        saveBoard(nextState);
        setShowStorageWarning(false);
      }

      return nextState;
    });
  }

  return (
    <main>
      {showStorageWarning && (
        <div role="alert">
          Saved task data could not be loaded. An empty board is being shown.
          Your previous stored value will remain unchanged until you modify
          the board.
        </div>
      )}

      <Board state={state} dispatch={dispatch} />
    </main>
  );
}
```

React reducer dispatch does not accept an updater function. Therefore, the example above needs a small wrapper reducer if persistence is performed in the dispatch path:

```tsx
type PersistentAction =
  | TaskAction
  | { type: "storage/initialized" };

function persistentReducer(
  state: BoardState,
  action: PersistentAction,
): BoardState {
  if (action.type === "storage/initialized") {
    return state;
  }

  const nextState = taskReducer(state, action);

  if (nextState !== state) {
    saveBoard(nextState);
  }

  return nextState;
}
```

Then initialize the component without dispatching a startup action:

```tsx
const initialLoad = loadBoard();

export default function App() {
  const [state, dispatch] = useReducer(
    persistentReducer,
    initialLoad.state,
  );
  const [showStorageWarning, setShowStorageWarning] = useState(
    initialLoad.status === "invalid",
  );

  function handleAction(action: TaskAction): void {
    dispatch(action);
    setShowStorageWarning(false);
  }

  return (
    <main>
      {showStorageWarning && (
        <div role="alert">
          Saved task data could not be loaded. An empty board is being shown.
          The stored value will be replaced when you modify the board.
        </div>
      )}

      <Board state={state} dispatch={handleAction} />
    </main>
  );
}
```

This design avoids a mount-time saving effect, so invalid stored data survives until a valid state-changing action occurs. An action that the reducer rejects should not count as a state change and should not overwrite storage.

## Board rendering and filtering

Render the three columns from the shared status constant rather than duplicating their identifiers:

```tsx
import { TASK_STATUSES, type BoardState } from "../model/tasks";
import type { TaskAction } from "../model/taskReducer";

const STATUS_LABELS = {
  backlog: "Backlog",
  doing: "Doing",
  done: "Done",
} as const;

interface BoardProps {
  state: BoardState;
  dispatch: (action: TaskAction) => void;
}

export function Board({ state, dispatch }: BoardProps) {
  return (
    <div aria-label="Task board">
      {TASK_STATUSES.map((status) => {
        const tasks = state.tasks.filter(
          (task) => task.status === status,
        );

        return (
          <section key={status} aria-labelledby={`${status}-heading`}>
            <h2 id={`${status}-heading`}>
              {STATUS_LABELS[status]}
            </h2>

            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                dispatch={dispatch}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
```

If the interface includes a separate column filter, represent “all columns” explicitly in UI state:

```ts
type ColumnFilter = "all" | TaskStatus;

const visibleTasks =
  filter === "all"
    ? state.tasks
    : state.tasks.filter((task) => task.status === filter);
```

Filtering changes only what is displayed. It should not modify or persist the task collection.

## Keyboard-accessible task movement

Dragging may be provided as a pointer convenience, but it cannot be the only way to move a task. Each task should expose ordinary controls that can be reached and activated from the keyboard.

A destination selector makes the available movement explicit:

```tsx
import type { ChangeEvent } from "react";
import type { Task, TaskStatus } from "../model/tasks";
import { TASK_STATUSES } from "../model/tasks";
import type { TaskAction } from "../model/taskReducer";

const STATUS_LABELS = {
  backlog: "Backlog",
  doing: "Doing",
  done: "Done",
} as const;

interface TaskCardProps {
  task: Task;
  dispatch: (action: TaskAction) => void;
}

export function TaskCard({ task, dispatch }: TaskCardProps) {
  function handleMove(event: ChangeEvent<HTMLSelectElement>) {
    dispatch({
      type: "task/moved",
      id: task.id,
      status: event.target.value as TaskStatus,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <article aria-label={task.title}>
      <h3>{task.title}</h3>

      <label>
        Column
        <select
          aria-label={`Move ${task.title} to column`}
          value={task.status}
          onChange={handleMove}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() =>
          dispatch({ type: "task/deleted", id: task.id })
        }
      >
        Delete
      </button>
    </article>
  );
}
```

This control works with a keyboard and communicates the current and available destinations. If native dragging is also implemented, dispatch the same `task/moved` action so that movement rules remain centralized.

After a move, provide a visible status update. An `aria-live` region can also announce the result to assistive technology:

```tsx
<p aria-live="polite">{movementMessage}</p>
```

## Testing

Configure Vitest to use jsdom and load the Testing Library matchers:

```ts
// vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

```ts
// src/test/setup.ts

import "@testing-library/jest-dom/vitest";
```

### Reducer tests

Use fixed timestamps and IDs so reducer tests remain deterministic:

```ts
import { describe, expect, it } from "vitest";
import { taskReducer } from "./taskReducer";
import type { Task } from "./tasks";

const task: Task = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  title: "Write tests",
  status: "backlog",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

describe("taskReducer", () => {
  it("adds a task", () => {
    const state = taskReducer(
      { tasks: [] },
      { type: "task/added", task },
    );

    expect(state.tasks).toEqual([task]);
  });

  it("moves a task and updates its timestamp", () => {
    const state = taskReducer(
      { tasks: [task] },
      {
        type: "task/moved",
        id: task.id,
        status: "doing",
        updatedAt: "2026-07-12T01:00:00.000Z",
      },
    );

    expect(state.tasks[0]).toMatchObject({
      status: "doing",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });
  });

  it("rejects an invalid edited title", () => {
    const original = { tasks: [task] };

    const state = taskReducer(original, {
      type: "task/titleChanged",
      id: task.id,
      title: " ",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });

    expect(state).toBe(original);
  });
});
```

Also cover title trimming, the 80-character boundary, deletion, and movement to the task’s current status.

### Stored-data validation tests

Inject a `Storage` implementation so tests do not depend on shared browser state:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  isBoardState,
  loadBoard,
} from "./taskStorage";

describe("task storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads a valid board", () => {
    const state = {
      tasks: [
        {
          id: "123e4567-e89b-42d3-a456-426614174000",
          title: "Write tests",
          status: "backlog",
          createdAt: "2026-07-12T00:00:00.000Z",
          updatedAt: "2026-07-12T00:00:00.000Z",
        },
      ],
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    expect(loadBoard(localStorage)).toEqual({
      status: "loaded",
      state,
    });
  });

  it("rejects invalid JSON without overwriting it", () => {
    localStorage.setItem(STORAGE_KEY, "{invalid");
    const original = localStorage.getItem(STORAGE_KEY);

    expect(loadBoard(localStorage)).toEqual({
      status: "invalid",
      state: { tasks: [] },
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe(original);
  });

  it("rejects data with the wrong shape", () => {
    expect(isBoardState({ tasks: [{ title: "Incomplete" }] }))
      .toBe(false);
  });
});
```

Validation tests should include invalid statuses, empty and overlong titles, malformed timestamps, non-UUID IDs, and non-array `tasks`.

### User-flow tests

Test adding and moving through the same controls a user operates. Prefer accessible role and label queries over CSS selectors.

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import App from "./App";
import { STORAGE_KEY } from "./persistence/taskStorage";

beforeEach(() => {
  localStorage.clear();
});

it("adds a task to Backlog", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(
    screen.getByLabelText(/task title/i),
    "Review reducer",
  );
  await user.click(screen.getByRole("button", { name: /add task/i }));

  const backlog = screen.getByRole("region", { name: /backlog/i });
  expect(
    within(backlog).getByText("Review reducer"),
  ).toBeInTheDocument();

  const stored = JSON.parse(
    localStorage.getItem(STORAGE_KEY) ?? "null",
  );
  expect(stored.tasks[0].title).toBe("Review reducer");
});

it("moves a task to Doing with a keyboard-accessible control", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(
    screen.getByLabelText(/task title/i),
    "Review reducer",
  );
  await user.click(screen.getByRole("button", { name: /add task/i }));

  await user.selectOptions(
    screen.getByLabelText(/move review reducer to column/i),
    "doing",
  );

  const doing = screen.getByRole("region", { name: /doing/i });
  expect(
    within(doing).getByText("Review reducer"),
  ).toBeInTheDocument();
});
```

For these region queries to work, each column section needs an accessible name, such as `aria-labelledby` pointing to its heading.

Add one integration test for invalid startup data. It should verify that the warning appears, the board begins empty, the invalid stored string remains unchanged immediately after rendering, and a subsequent successful task change replaces it with valid state.

## Completion criteria

Pocket Queue is complete when users can add, rename, move, delete, and filter tasks across the three columns; all movement is available without dragging; valid state survives a reload; and invalid stored data produces an empty board with an in-app warning without being overwritten during startup.

Features beyond this local single-page workflow—including accounts, server storage, synchronization, and additional board capabilities—remain outside this version.