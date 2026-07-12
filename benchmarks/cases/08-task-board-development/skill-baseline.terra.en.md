# Pocket Queue Development Guide

Pocket Queue is a local-only task board. It runs entirely in the browser, has three fixed columns—`backlog`, `doing`, and `done`—and stores its board state in `localStorage`. There is no server, authentication, synchronization, task ordering, or drag-and-drop behavior in this version.

Use React 19, Vite 7, and TypeScript with `"strict": true`.

## Structure and data model

Keep task and UI state in one reducer. Put browser storage and stored-data validation in a separate module so the reducer remains pure and can be tested without `localStorage`.

```text
src/
  board.ts          // types, task creation, reducer
  storage.ts        // localStorage reads, writes, and validation
  App.tsx           // forms, columns, and reducer integration
  board.test.ts
  storage.test.ts
  App.test.tsx
```

A task has the following shape:

```ts
// src/board.ts
export const STATUSES = ["backlog", "doing", "done"] as const;

export type TaskStatus = (typeof STATUSES)[number];
export type TaskFilter = "all" | TaskStatus;

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type PersistedBoard = {
  tasks: Task[];
  filter: TaskFilter;
};

export type BoardState = PersistedBoard & {
  warning: string | null;
};

export type BoardAction =
  | { type: "add"; task: Task }
  | { type: "rename"; id: string; title: string }
  | { type: "move"; id: string; status: TaskStatus }
  | { type: "remove"; id: string }
  | { type: "setFilter"; filter: TaskFilter };
```

Create IDs and timestamps outside the reducer. This keeps reducer actions deterministic in tests.

```ts
export function assertValidTitle(title: string): void {
  if (title.length < 1 || title.length > 80) {
    throw new RangeError("A task title must contain 1–80 characters.");
  }
}

export function createTask(title: string, now = new Date()): Task {
  assertValidTitle(title);

  const timestamp = now.toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    status: "backlog",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
```

`crypto.randomUUID()` creates the browser-generated UUID required for a new task. Validate title length again in the reducer when renaming, because reducer actions are the final boundary for task state.

## Reducer

The reducer owns every board change: adding, renaming, moving, deleting, and changing the filter. It also clears an initial storage warning after the user makes a real change.

```ts
// src/board.ts
function replaceTask(
  state: BoardState,
  id: string,
  update: (task: Task) => Task,
): BoardState {
  const current = state.tasks.find((task) => task.id === id);

  if (!current) {
    return state;
  }

  const nextTask = update(current);

  if (nextTask === current) {
    return state;
  }

  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? nextTask : task)),
    warning: null,
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "add":
      return {
        ...state,
        tasks: [...state.tasks, action.task],
        warning: null,
      };

    case "rename": {
      assertValidTitle(action.title);

      return replaceTask(state, action.id, (task) =>
        task.title === action.title
          ? task
          : {
              ...task,
              title: action.title,
              updatedAt: new Date().toISOString(),
            },
      );
    }

    case "move":
      return replaceTask(state, action.id, (task) =>
        task.status === action.status
          ? task
          : {
              ...task,
              status: action.status,
              updatedAt: new Date().toISOString(),
            },
      );

    case "remove":
      if (!state.tasks.some((task) => task.id === action.id)) {
        return state;
      }

      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.id),
        warning: null,
      };

    case "setFilter":
      return state.filter === action.filter
        ? state
        : { ...state, filter: action.filter, warning: null };
  }
}
```

The reducer returns the existing state for no-op changes, such as moving a task to its current column. That prevents unnecessary renders and storage writes.

## Storage and validation

Store a single JSON object under `pocket-queue:v1`.

```ts
// src/storage.ts
import {
  STATUSES,
  type PersistedBoard,
  type Task,
  type TaskFilter,
  type TaskStatus,
} from "./board";

export const STORAGE_KEY = "pocket-queue:v1";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type LoadResult = {
  board: PersistedBoard;
  warning: string | null;
};

export const emptyPersistedBoard = (): PersistedBoard => ({
  tasks: [],
  filter: "all",
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" &&
    (STATUSES as readonly string[]).includes(value);
}

function isFilter(value: unknown): value is TaskFilter {
  return value === "all" || isStatus(value);
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    UUID_PATTERN.test(value.id) &&
    typeof value.title === "string" &&
    value.title.length >= 1 &&
    value.title.length <= 80 &&
    isStatus(value.status) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function parseStoredBoard(value: unknown): PersistedBoard | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.tasks) ||
    !value.tasks.every(isTask) ||
    !isFilter(value.filter)
  ) {
    return null;
  }

  const ids = value.tasks.map((task) => task.id);

  if (new Set(ids).size !== ids.length) {
    return null;
  }

  return {
    tasks: value.tasks,
    filter: value.filter,
  };
}

export function loadBoard(): LoadResult {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return { board: emptyPersistedBoard(), warning: null };
  }

  try {
    const board = parseStoredBoard(JSON.parse(raw));

    if (board) {
      return { board, warning: null };
    }
  } catch {
    // Invalid JSON follows the same recovery path as an invalid shape.
  }

  return {
    board: emptyPersistedBoard(),
    warning:
      "Saved Pocket Queue data could not be read. The board is empty until you make a change.",
  };
}

export function saveBoard(board: PersistedBoard): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}
```

`loadBoard` never removes or replaces invalid stored data. It returns an empty board and a warning instead. The first subsequent board state change writes a valid board to the same key, which is the intended recovery point.

## Connect storage to React

Load state with a lazy reducer initializer. Do not save on the initial render: doing so would immediately overwrite an invalid saved value before the user changes anything.

```tsx
// src/App.tsx
import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  boardReducer,
  createTask,
  type BoardAction,
  type BoardState,
} from "./board";
import { loadBoard, saveBoard } from "./storage";

function initialState(): BoardState {
  const { board, warning } = loadBoard();

  return {
    ...board,
    warning,
  };
}

export default function App() {
  const [state, reduce] = useReducer(boardReducer, undefined, initialState);
  const hasUserMutation = useRef(false);

  const dispatch = useCallback((action: BoardAction) => {
    hasUserMutation.current = true;
    reduce(action);
  }, []);

  useEffect(() => {
    if (!hasUserMutation.current) {
      return;
    }

    saveBoard({
      tasks: state.tasks,
      filter: state.filter,
    });
  }, [state.filter, state.tasks]);

  const visibleTasks =
    state.filter === "all"
      ? state.tasks
      : state.tasks.filter((task) => task.status === state.filter);

  return (
    <main>
      <h1>Pocket Queue</h1>

      {state.warning && <p role="alert">{state.warning}</p>}

      {/* Add-task form and filter control */}

      {["backlog", "doing", "done"].map((status) => (
        <section key={status} aria-labelledby={`${status}-heading`}>
          <h2 id={`${status}-heading`}>{status}</h2>

          {visibleTasks
            .filter((task) => task.status === status)
            .map((task) => (
              <TaskCard key={task.id} task={task} dispatch={dispatch} />
            ))}
        </section>
      ))}
    </main>
  );
}
```

The filter is persisted with the board so the app restores the same visible view after reload. The warning is intentionally not persisted.

## Task interactions

Use ordinary HTML controls. Native buttons work with mouse, keyboard, and assistive technology, so the board does not need drag-and-drop to satisfy the movement requirement.

```tsx
import type { FormEvent } from "react";
import { STATUSES, type BoardAction, type Task } from "./board";

type TaskCardProps = {
  task: Task;
  dispatch: (action: BoardAction) => void;
};

function TaskCard({ task, dispatch }: TaskCardProps) {
  function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = new FormData(event.currentTarget).get("title");

    if (typeof title === "string") {
      dispatch({ type: "rename", id: task.id, title });
    }
  }

  return (
    <article>
      <form onSubmit={saveTitle}>
        <label>
          Task title
          <input
            name="title"
            defaultValue={task.title}
            minLength={1}
            maxLength={80}
            required
          />
        </label>
        <button type="submit">Save title</button>
      </form>

      <div aria-label={`Move ${task.title}`}>
        {STATUSES.filter((status) => status !== task.status).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => dispatch({ type: "move", id: task.id, status })}
          >
            Move to {status}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "remove", id: task.id })}
      >
        Delete
      </button>
    </article>
  );
}
```

For the add form, create the task before dispatching it:

```tsx
function addTask(title: string) {
  dispatch({
    type: "add",
    task: createTask(title),
  });
}
```

Use a controlled filter input or a native `<select>` that dispatches `setFilter`. Keep the option values exactly `all`, `backlog`, `doing`, and `done`.

## Testing

Use Vitest and React Testing Library. Test the pure reducer and validation separately, then verify the visible user path through the rendered app.

### Reducer tests

```ts
// src/board.test.ts
import { describe, expect, it } from "vitest";
import { boardReducer, type BoardState, type Task } from "./board";

const task: Task = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  title: "Write the guide",
  status: "backlog",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

const initial: BoardState = {
  tasks: [task],
  filter: "all",
  warning: null,
};

describe("boardReducer", () => {
  it("moves a task and updates its timestamp", () => {
    const result = boardReducer(initial, {
      type: "move",
      id: task.id,
      status: "doing",
    });

    expect(result.tasks[0].status).toBe("doing");
    expect(result.tasks[0].updatedAt).not.toBe(task.updatedAt);
  });

  it("removes a task", () => {
    const result = boardReducer(initial, {
      type: "remove",
      id: task.id,
    });

    expect(result.tasks).toEqual([]);
  });
});
```

### Stored-data validation tests

```ts
// src/storage.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  loadBoard,
  parseStoredBoard,
} from "./storage";

describe("stored board validation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("accepts a valid stored board", () => {
    expect(
      parseStoredBoard({
        tasks: [],
        filter: "all",
      }),
    ).toEqual({
      tasks: [],
      filter: "all",
    });
  });

  it("starts empty without overwriting invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid JSON");

    const result = loadBoard();

    expect(result.board).toEqual({ tasks: [], filter: "all" });
    expect(result.warning).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{not valid JSON");
  });

  it("rejects data with an invalid task shape", () => {
    expect(
      parseStoredBoard({
        tasks: [{ id: "not-a-uuid", title: "", status: "later" }],
        filter: "all",
      }),
    ).toBeNull();
  });
});
```

### Add and move user flow

Give the add input, columns, and movement controls stable accessible names. The move action should be tested as a keyboard action, not only as a click.

```tsx
// src/App.test.tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("Pocket Queue", () => {
  it("adds a task and moves it with the keyboard", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(
      screen.getByRole("textbox", { name: "New task title" }),
      "Write the guide",
    );
    await user.click(screen.getByRole("button", { name: "Add task" }));

    const card = screen.getByText("Write the guide").closest("article");

    expect(card).not.toBeNull();

    const moveButton = within(card as HTMLElement).getByRole("button", {
      name: "Move to doing",
    });

    moveButton.focus();
    await user.keyboard("{Enter}");

    expect(
      within(screen.getByTestId("column-doing")).getByText("Write the guide"),
    ).toBeInTheDocument();
  });
});
```

The completed version should have one reducer as the source of board changes, one storage module as the source of persistence behavior, native keyboard-operable task movement, and tests covering reducer behavior, invalid stored data, and the add-and-move path.