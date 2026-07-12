# Pocket Queue 開発ガイド

Pocket Queueは、React 19・Vite 7・TypeScriptで作る端末内完結型のタスクボードです。サーバー通信は行わず、タスクを`localStorage`へ保存します。

## 1. 対象範囲

実装する機能は次のとおりです。

- タスク追加
- タイトル編集
- `backlog`、`doing`、`done`間の移動
- タスク削除
- 列による絞り込み
- ドラッグによる移動
- ボタンとキーボードによる移動
- `localStorage`への保存と復元
- 不正な保存データからの安全な復旧

検索、並べ替え、期限、タグ、認証、サーバー同期、複数端末対応などは対象外です。

## 2. 推奨ディレクトリ構成

```text
src/
├─ components/
│  ├─ TaskBoard.tsx
│  ├─ TaskColumn.tsx
│  ├─ TaskCard.tsx
│  ├─ AddTaskForm.tsx
│  └─ FilterControls.tsx
├─ domain/
│  ├─ task.ts
│  ├─ boardReducer.ts
│  └─ boardReducer.test.ts
├─ storage/
│  ├─ boardStorage.ts
│  └─ boardStorage.test.ts
├─ test/
│  └─ setup.ts
├─ App.tsx
├─ App.test.tsx
└─ main.tsx
```

コンポーネントから保存処理を分離し、状態の変更規則はreducerへ集約します。

## 3. データ型

```ts
// src/domain/task.ts

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

export function normalizeTitle(value: string): string {
  return value.trim();
}

export function isValidTitle(value: string): boolean {
  const title = normalizeTitle(value);
  return title.length >= 1 && title.length <= 80;
}
```

日時は`Date`オブジェクトではなく、`new Date().toISOString()`で生成した文字列として保存します。これによりJSON化と復元が単純になります。

## 4. reducer

永続化対象の変更回数を`revision`で管理します。初期値を`0`にしておけば、起動直後の保存を抑止できます。

```ts
// src/domain/boardReducer.ts

import type { Task, TaskFilter, TaskStatus } from "./task";
import { isValidTitle, normalizeTitle } from "./task";

export interface BoardState {
  tasks: Task[];
  filter: TaskFilter;
  revision: number;
  warning: string | null;
}

export type BoardAction =
  | {
      type: "task/added";
      id: string;
      title: string;
      now: string;
    }
  | {
      type: "task/renamed";
      id: string;
      title: string;
      now: string;
    }
  | {
      type: "task/moved";
      id: string;
      status: TaskStatus;
      now: string;
    }
  | {
      type: "task/removed";
      id: string;
    }
  | {
      type: "filter/changed";
      filter: TaskFilter;
    }
  | {
      type: "storage/failed";
      message: string;
    };

function changed(
  state: BoardState,
  tasks: Task[],
): BoardState {
  return {
    ...state,
    tasks,
    revision: state.revision + 1,
    warning: null,
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "task/added": {
      const title = normalizeTitle(action.title);

      if (!isValidTitle(title)) {
        return state;
      }

      const task: Task = {
        id: action.id,
        title,
        status: "backlog",
        createdAt: action.now,
        updatedAt: action.now,
      };

      return changed(state, [...state.tasks, task]);
    }

    case "task/renamed": {
      const title = normalizeTitle(action.title);

      if (!isValidTitle(title)) {
        return state;
      }

      let found = false;

      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id || task.title === title) {
          return task;
        }

        found = true;
        return { ...task, title, updatedAt: action.now };
      });

      return found ? changed(state, tasks) : state;
    }

    case "task/moved": {
      let found = false;

      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id || task.status === action.status) {
          return task;
        }

        found = true;
        return {
          ...task,
          status: action.status,
          updatedAt: action.now,
        };
      });

      return found ? changed(state, tasks) : state;
    }

    case "task/removed": {
      const tasks = state.tasks.filter((task) => task.id !== action.id);
      return tasks.length === state.tasks.length
        ? state
        : changed(state, tasks);
    }

    case "filter/changed":
      return { ...state, filter: action.filter };

    case "storage/failed":
      return { ...state, warning: action.message };
  }
}
```

UUIDや現在時刻をactionに含めることで、reducerを純粋関数のまま保ち、テストを決定的にできます。

呼び出し側では次のように生成します。

```ts
const now = new Date().toISOString();

dispatch({
  type: "task/added",
  id: crypto.randomUUID(),
  title,
  now,
});
```

## 5. 保存データの検証

保存形式にも明示的なバージョンを持たせます。

```ts
// src/storage/boardStorage.ts

import {
  TASK_STATUSES,
  type Task,
  type TaskStatus,
} from "../domain/task";

export const STORAGE_KEY = "pocket-queue:v1";

interface PersistedBoard {
  version: 1;
  tasks: Task[];
}

export type LoadResult =
  | { status: "empty"; tasks: [] }
  | { status: "loaded"; tasks: Task[] }
  | { status: "invalid"; tasks: []; warning: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    TASK_STATUSES.includes(value as TaskStatus)
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
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

export function parsePersistedBoard(value: unknown): Task[] | null {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.tasks) ||
    !value.tasks.every(isTask)
  ) {
    return null;
  }

  const ids = new Set(value.tasks.map((task) => task.id));

  if (ids.size !== value.tasks.length) {
    return null;
  }

  return value.tasks;
}

export function loadTasks(): LoadResult {
  let raw: string | null;

  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      status: "invalid",
      tasks: [],
      warning: "保存データを読み込めませんでした。空のボードを表示しています。",
    };
  }

  if (raw === null) {
    return { status: "empty", tasks: [] };
  }

  try {
    const tasks = parsePersistedBoard(JSON.parse(raw));

    if (tasks === null) {
      throw new Error("Invalid schema");
    }

    return { status: "loaded", tasks };
  } catch {
    return {
      status: "invalid",
      tasks: [],
      warning:
        "保存データが壊れているため、空のボードを表示しています。次の変更時に保存データを作り直します。",
    };
  }
}

export function saveTasks(tasks: Task[]): void {
  const value: PersistedBoard = {
    version: 1,
    tasks,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
```

不正な値を発見しても、`loadTasks()`では削除も保存もしません。利用者が次に追加、編集、移動、削除を行い、`revision`が増えた時点で初めて上書きします。

## 6. Reactへの組み込み

```tsx
// src/App.tsx

import { useEffect, useReducer } from "react";
import {
  boardReducer,
  type BoardState,
} from "./domain/boardReducer";
import { loadTasks, saveTasks } from "./storage/boardStorage";
import { TaskBoard } from "./components/TaskBoard";

function createInitialState(): BoardState {
  const result = loadTasks();

  return {
    tasks: result.tasks,
    filter: "all",
    revision: 0,
    warning: result.status === "invalid" ? result.warning : null,
  };
}

export default function App() {
  const [state, dispatch] = useReducer(
    boardReducer,
    undefined,
    createInitialState,
  );

  useEffect(() => {
    if (state.revision === 0) {
      return;
    }

    try {
      saveTasks(state.tasks);
    } catch {
      dispatch({
        type: "storage/failed",
        message:
          "変更を端末に保存できませんでした。ブラウザーの保存設定を確認してください。",
      });
    }
  }, [state.revision, state.tasks]);

  return (
    <main>
      <h1>Pocket Queue</h1>

      {state.warning !== null ? (
        <p role="alert">{state.warning}</p>
      ) : null}

      <TaskBoard state={state} dispatch={dispatch} />
    </main>
  );
}
```

フィルター変更は永続化対象ではないため、`revision`を増やしません。

表示対象は新しいstateとして保持せず、描画時に導出します。

```ts
const visibleTasks =
  state.filter === "all"
    ? state.tasks
    : state.tasks.filter((task) => task.status === state.filter);
```

## 7. ドラッグとキーボード操作

ドラッグにはブラウザー標準のDrag and Drop APIを使えます。

```tsx
<article
  draggable
  onDragStart={(event) => {
    event.dataTransfer.setData("text/plain", task.id);
  }}
>
  {/* タスク内容 */}
</article>
```

列側でドロップを受け取ります。

```tsx
<section
  aria-labelledby={`${status}-heading`}
  onDragOver={(event) => event.preventDefault()}
  onDrop={(event) => {
    const id = event.dataTransfer.getData("text/plain");

    dispatch({
      type: "task/moved",
      id,
      status,
      now: new Date().toISOString(),
    });
  }}
>
```

ドラッグだけに依存せず、カード内に移動ボタンを設けます。

```tsx
<button
  type="button"
  onClick={() =>
    dispatch({
      type: "task/moved",
      id: task.id,
      status: "doing",
      now: new Date().toISOString(),
    })
  }
>
  Doingへ移動
</button>
```

通常の`button`はEnterとSpaceで操作できるため、独自のキーイベント処理は原則不要です。現在列に応じて、次のようにボタンを表示します。

- Backlog: 「Doingへ移動」
- Doing: 「Backlogへ移動」「Doneへ移動」
- Done: 「Doingへ移動」

列には見出しを付け、移動後は`aria-live="polite"`領域で結果を知らせると操作状況が伝わりやすくなります。

## 8. テスト方針

### reducer

```ts
import { describe, expect, it } from "vitest";
import { boardReducer, type BoardState } from "./boardReducer";

const initialState: BoardState = {
  tasks: [],
  filter: "all",
  revision: 0,
  warning: null,
};

describe("boardReducer", () => {
  it("タスクをbacklogへ追加する", () => {
    const state = boardReducer(initialState, {
      type: "task/added",
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "  ガイドを書く  ",
      now: "2026-07-12T00:00:00.000Z",
    });

    expect(state.tasks[0]).toMatchObject({
      title: "ガイドを書く",
      status: "backlog",
    });
    expect(state.revision).toBe(1);
  });

  it("タスクを別の列へ移動する", () => {
    const added = boardReducer(initialState, {
      type: "task/added",
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "テストする",
      now: "2026-07-12T00:00:00.000Z",
    });

    const moved = boardReducer(added, {
      type: "task/moved",
      id: added.tasks[0].id,
      status: "doing",
      now: "2026-07-12T01:00:00.000Z",
    });

    expect(moved.tasks[0].status).toBe("doing");
    expect(moved.tasks[0].updatedAt).toBe(
      "2026-07-12T01:00:00.000Z",
    );
  });
});
```

### 保存データの検証

```ts
import { describe, expect, it } from "vitest";
import { parsePersistedBoard } from "./boardStorage";

describe("parsePersistedBoard", () => {
  it("正しい保存データを受け入れる", () => {
    const tasks = parsePersistedBoard({
      version: 1,
      tasks: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          title: "実装する",
          status: "backlog",
          createdAt: "2026-07-12T00:00:00.000Z",
          updatedAt: "2026-07-12T00:00:00.000Z",
        },
      ],
    });

    expect(tasks).toHaveLength(1);
  });

  it.each([
    null,
    [],
    { version: 2, tasks: [] },
    { version: 1, tasks: [{ title: "不完全" }] },
  ])("不正な値を拒否する", (value) => {
    expect(parsePersistedBoard(value)).toBeNull();
  });
});
```

JSON構文エラーについては、`localStorage`へ`"{"`などを設定して`loadTasks()`が`invalid`を返すことも確認します。

### 利用者操作

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
});

it("タスクを追加してボタンでDoingへ移動できる", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(
    screen.getByLabelText("タスクのタイトル"),
    "保存処理を書く",
  );
  await user.click(screen.getByRole("button", { name: "追加" }));

  const backlog = screen.getByRole("region", { name: "Backlog" });
  expect(
    within(backlog).getByText("保存処理を書く"),
  ).toBeInTheDocument();

  await user.click(
    within(backlog).getByRole("button", {
      name: "Doingへ移動",
    }),
  );

  const doing = screen.getByRole("region", { name: "Doing" });
  expect(
    within(doing).getByText("保存処理を書く"),
  ).toBeInTheDocument();
});
```

列を`role="region"`と`aria-label`または`aria-labelledby`で識別できるように実装します。

## 9. 完了条件

- TypeScriptのstrictチェックが通る
- reducer以外からタスク配列を直接変更していない
- 初回表示ではlocalStorageへ書き込まない
- 不正データ時に空のボードと`role="alert"`の警告が出る
- 不正データは次の実変更まで上書きされない
- 同じ列への移動など、実質的に変化しない操作では保存しない
- タイトルの空白のみ、81文字以上を受け付けない
- ドラッグを使わず、ボタンだけですべての列へ移動できる
- reducer、保存データ検証、追加・列移動のテストが通る
- `npm run build`、`npm test`が成功する