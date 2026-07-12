# Pocket Queue development guide

Pocket Queue is a local-only React task board. Its single source of truth is a reducer-managed list of tasks; the persistence module is responsible only for validating and reading or writing that state to `localStorage`.

The board has three columns: `backlog`, `doing`, and `done`. Moving a task is performed through native buttons, so it works with keyboard navigation without requiring drag and drop.

## Domain model and reducer

Keep the task model and all allowed state transitions together in `src/board.ts`.

```ts
export const STATUSES = ["backlog", "doing", "done"] as const;

export type TaskStatus = (typeof STATUSES)[number];

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type BoardState = {
  tasks: Task[];
};

export type BoardAction =
  | { type: "add"; id: string; title: string; at: string }
  | { type: "editTitle"; id: string; title: string; at: string }
  | { type: "move"; id: string; status: TaskStatus; at: string }
  | { type: "delete"; id: string };

export const initialBoard: BoardState = { tasks: [] };

export function isValidTitle(value: string): boolean {
  return value.length >= 1 && value.length <= 80;
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "add": {
      if (
        !isValidTitle(action.title) ||
        state.tasks.some((task) => task.id === action.id)
      ) {
        return state;
      }

      const task: Task = {
        id: action.id,
        title: action.title,
        status: "backlog",
        createdAt: action.at,
        updatedAt: action.at,
      };

      return { tasks: [...state.tasks, task] };
    }

    case "editTitle": {
      if (!isValidTitle(action.title)) return state;

      return {
        tasks: state.tasks.map((task) =>
          task.id === action.id && task.title !== action.title
            ? { ...task, title: action.title, updatedAt: action.at }
            : task,
        ),
      };
    }

    case "move": {
      return {
        tasks: state.tasks.map((task) =>
          task.id === action.id && task.status !== action.status
            ? { ...task, status: action.status, updatedAt: action.at }
            : task,
        ),
      };
    }

    case "delete":
      return {
        tasks: state.tasks.filter((task) => task.id !== action.id),
      };
  }
}
```

The reducer returns the existing task values for unaffected tasks. This keeps updates predictable and makes it straightforward to test that adding, editing, moving, and deleting are the only state changes in scope.

Create actions at the UI boundary so that timestamps and UUIDs are explicit:

```ts
function now(): string {
  return new Date().toISOString();
}

apply({
  type: "add",
  id: crypto.randomUUID(),
  title,
  at: now(),
});
```

## Persistence and validation

Put storage access in `src/storage.ts`, separate from reducer logic. Stored values use the shape `{ tasks: Task[] }` under the key `pocket-queue:v1`.

```ts
import type { BoardState, Task, TaskStatus } from "./board";
import { STATUSES, initialBoard, isValidTitle } from "./board";

export const STORAGE_KEY = "pocket-queue:v1";

export type LoadResult = {
  state: BoardState;
  warning: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)
  );
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (STATUSES as readonly string[]).includes(value)
  );
}

export function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false;

  return (
    isUuid(value.id) &&
    typeof value.title === "string" &&
    isValidTitle(value.title) &&
    isTaskStatus(value.status) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  );
}

export function isBoardState(value: unknown): value is BoardState {
  if (!isRecord(value) || !Array.isArray(value.tasks)) return false;

  const ids = new Set<string>();

  return value.tasks.every((task) => {
    if (!isTask(task) || ids.has(task.id)) return false;
    ids.add(task.id);
    return true;
  });
}

export function loadBoard(): LoadResult {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return { state: initialBoard, warning: null };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isBoardState(parsed)) {
      return { state: parsed, warning: null };
    }
  } catch {
    // The warning below covers invalid JSON as well as an invalid shape.
  }

  return {
    state: initialBoard,
    warning: "Saved Pocket Queue data could not be loaded. Starting with an empty board.",
  };
}

export function saveBoard(state: BoardState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
```

Do not save during initial loading. If the stored value is malformed, the app must leave it untouched until a later user action produces a real state change.

## Connect the reducer to the app

Load once when the application starts. Use a ref to distinguish the initial state from changes initiated through the interface.

```tsx
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  boardReducer,
  STATUSES,
  type BoardAction,
  type TaskStatus,
} from "./board";
import { loadBoard, saveBoard } from "./storage";

type ColumnFilter = TaskStatus | "all";

export function App() {
  const [{ state: loadedState, warning }] = useState(loadBoard);
  const [state, dispatch] = useReducer(boardReducer, loadedState);
  const hasChanged = useRef(false);
  const [filter, setFilter] = useState<ColumnFilter>("all");

  const apply = useCallback((action: BoardAction) => {
    hasChanged.current = true;
    dispatch(action);
  }, []);

  useEffect(() => {
    if (hasChanged.current) {
      saveBoard(state);
    }
  }, [state]);

  const visibleTasks = state.tasks.filter(
    (task) => filter === "all" || task.status === filter,
  );

  return (
    <main>
      <h1>Pocket Queue</h1>

      {warning !== null && <p role="alert">{warning}</p>}

      <TaskForm
        onAdd={(title) =>
          apply({
            type: "add",
            id: crypto.randomUUID(),
            title,
            at: new Date().toISOString(),
          })
        }
      />

      <label>
        Show column
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as ColumnFilter)}
        >
          <option value="all">All columns</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <div className="board">
        {STATUSES.map((status) => (
          <section key={status} aria-label={status}>
            <h2>{status}</h2>

            {visibleTasks
              .filter((task) => task.status === status)
              .map((task) => (
                <TaskCard key={task.id} task={task} apply={apply} />
              ))}
          </section>
        ))}
      </div>
    </main>
  );
}
```

The ref begins as `false`, so valid saved data is not immediately written back and invalid saved data is preserved while the warning is visible. A reducer action that produces no state change does not trigger the effect; the next actual change replaces the invalid stored value.

## Accessible task controls

Use ordinary form controls and buttons. This meets the keyboard requirement without introducing drag-and-drop behavior or a drag-and-drop library.

```tsx
import { useState } from "react";
import { STATUSES, type BoardAction, type Task } from "./board";

export function TaskForm({
  onAdd,
}: {
  onAdd: (title: string) => void;
}) {
  const [title, setTitle] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(title);
        setTitle("");
      }}
    >
      <label>
        New task
        <input
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <button type="submit">Add task</button>
    </form>
  );
}

export function TaskCard({
  task,
  apply,
}: {
  task: Task;
  apply: (action: BoardAction) => void;
}) {
  const [title, setTitle] = useState(task.title);

  return (
    <article>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply({
            type: "editTitle",
            id: task.id,
            title,
            at: new Date().toISOString(),
          });
        }}
      >
        <label>
          Title for {task.title}
          <input
            value={title}
            maxLength={80}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <button type="submit">Save title</button>
      </form>

      <div aria-label={`Move ${task.title}`}>
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={task.status === status}
            onClick={() =>
              apply({
                type: "move",
                id: task.id,
                status,
                at: new Date().toISOString(),
              })
            }
          >
            Move to {status}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => apply({ type: "delete", id: task.id })}
      >
        Delete
      </button>
    </article>
  );
}
```

The disabled button identifies the current column, while the remaining buttons offer every permitted destination. Native buttons are focusable and can be activated with Enter or Space.

## Tests

Test the reducer as a pure state transition.

```ts
import { describe, expect, it } from "vitest";
import { boardReducer, initialBoard } from "./board";

const id = "550e8400-e29b-41d4-a716-446655440000";
const at = "2026-07-12T09:00:00.000Z";

describe("boardReducer", () => {
  it("adds a task to backlog and moves it to doing", () => {
    const added = boardReducer(initialBoard, {
      type: "add",
      id,
      title: "Write guide",
      at,
    });

    const moved = boardReducer(added, {
      type: "move",
      id,
      status: "doing",
      at: "2026-07-12T09:05:00.000Z",
    });

    expect(moved.tasks).toHaveLength(1);
    expect(moved.tasks[0]).toMatchObject({
      id,
      title: "Write guide",
      status: "doing",
      createdAt: at,
    });
  });
});
```

Test validation independently from the UI, including malformed JSON and structurally invalid data.

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { loadBoard, STORAGE_KEY } from "./storage";

describe("loadBoard", () => {
  beforeEach(() => localStorage.clear());

  it("uses an empty board and warns for invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not-json");

    const result = loadBoard();

    expect(result.state.tasks).toEqual([]);
    expect(result.warning).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{not-json");
  });

  it("uses an empty board and warns for an invalid task shape", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tasks: [{ title: "Missing required fields" }] }),
    );

    expect(loadBoard().warning).not.toBeNull();
  });
});
```

Finally, use React Testing Library for the user-visible add-and-move path. The test relies on the accessible labels and button names used above.

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "./App";

beforeEach(() => localStorage.clear());

it("lets a user add a task and move it with buttons", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByLabelText("New task"), "Write guide");
  await user.click(screen.getByRole("button", { name: "Add task" }));

  await user.click(
    screen.getByRole("button", { name: "Move to doing" }),
  );

  expect(
    within(screen.getByRole("region", { name: "doing" }))
      .getByDisplayValue("Write guide"),
  ).toBeInTheDocument();
});
```

Keep this version limited to local task management: no server API, authentication, synchronization, external drag-and-drop library, or additional task fields.