# Pocket Queue 開発ガイド

Pocket Queue は、端末内だけで使う1画面のタスクボードです。サーバー通信、認証、同期は実装せず、タスクをブラウザの `localStorage` に保存します。画面は `backlog`、`doing`、`done` の3列で構成し、タスクの追加、編集、移動、削除、絞り込みを提供します。

実装の中心は、タスク状態を reducer に集約し、保存と検証を別モジュールに分けることです。これにより、UIから保存形式の詳細を切り離し、壊れた保存データにも一貫して対応できます。

## 構成

```text
src/
  domain.ts       # データ型と列の定義
  reducer.ts      # 状態遷移
  storage.ts      # localStorage の読み書きと検証
  App.tsx         # 画面と利用者操作
  *.test.ts(x)    # Vitest / React Testing Library のテスト
```

## データ型

`src/domain.ts` では、アプリ全体で使う型と列の順序を定義します。

```ts
export const STATUSES = ["backlog", "doing", "done"] as const;

export type Status = (typeof STATUSES)[number];

export type Task = {
  id: string;
  title: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export const isStatus = (value: unknown): value is Status =>
  typeof value === "string" &&
  (STATUSES as readonly string[]).includes(value);

export const isTitleLengthValid = (title: string): boolean => {
  const length = Array.from(title).length;
  return length >= 1 && length <= 80;
};
```

日時は `Date.prototype.toISOString()` の返り値を文字列として保存します。JSONへそのまま書き出せ、読み込み時にも検証しやすいためです。

## 保存データの読み書きと検証

保存先は `pocket-queue:v1` です。読み込みに失敗した場合は空のボードを返し、壊れていたことを呼び出し元へ伝えます。この時点では `localStorage` を書き換えません。利用者が次にタスクを追加、編集、移動、削除した時だけ、正しい状態で上書きします。

`src/storage.ts`:

```ts
import { isStatus, isTitleLengthValid, type Task } from "./domain";

const STORAGE_KEY = "pocket-queue:v1";

type LoadResult =
  | { tasks: Task[]; warning: null }
  | { tasks: Task[]; warning: string };

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const isTask = (value: unknown): value is Task => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const task = value as Record<string, unknown>;

  return (
    isUuid(task.id) &&
    typeof task.title === "string" &&
    isTitleLengthValid(task.title) &&
    isStatus(task.status) &&
    isIsoDate(task.createdAt) &&
    isIsoDate(task.updatedAt)
  );
};

export const loadTasks = (): LoadResult => {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return { tasks: [], warning: null };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed) || !parsed.every(isTask)) {
      return {
        tasks: [],
        warning: "保存済みのデータを読み込めませんでした。空のボードを表示しています。",
      };
    }

    return { tasks: parsed, warning: null };
  } catch {
    return {
      tasks: [],
      warning: "保存済みのデータを読み込めませんでした。空のボードを表示しています。",
    };
  }
};

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};
```

`unknown` から始めて、配列、各タスク、各フィールドの順に確認します。型アサーションだけで `Task[]` と見なすと、壊れた保存データを画面や reducer に渡してしまうためです。

## reducer

状態変更を reducer に集めます。`revision` は保存対象ではなく、実際にタスクが変わった後だけ保存処理を動かすための番号です。これにより、起動時に壊れた保存値を検出しても、何も操作しない限り元の値を上書きしません。

`src/reducer.ts`:

```ts
import { isTitleLengthValid, type Status, type Task } from "./domain";

export type BoardState = {
  tasks: Task[];
  revision: number;
};

export type BoardAction =
  | { type: "task/add"; title: string; now: string; id: string }
  | { type: "task/rename"; id: string; title: string; now: string }
  | { type: "task/move"; id: string; status: Status; now: string }
  | { type: "task/delete"; id: string };

const changed = (tasks: Task[], state: BoardState): BoardState => ({
  tasks,
  revision: state.revision + 1,
});

export const boardReducer = (
  state: BoardState,
  action: BoardAction,
): BoardState => {
  switch (action.type) {
    case "task/add": {
      if (!isTitleLengthValid(action.title)) {
        return state;
      }

      const task: Task = {
        id: action.id,
        title: action.title,
        status: "backlog",
        createdAt: action.now,
        updatedAt: action.now,
      };

      return changed([...state.tasks, task], state);
    }

    case "task/rename": {
      if (!isTitleLengthValid(action.title)) {
        return state;
      }

      let found = false;
      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id) {
          return task;
        }

        found = true;
        return { ...task, title: action.title, updatedAt: action.now };
      });

      return found ? changed(tasks, state) : state;
    }

    case "task/move": {
      let found = false;
      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id || task.status === action.status) {
          return task;
        }

        found = true;
        return { ...task, status: action.status, updatedAt: action.now };
      });

      return found ? changed(tasks, state) : state;
    }

    case "task/delete": {
      const tasks = state.tasks.filter((task) => task.id !== action.id);
      return tasks.length === state.tasks.length ? state : changed(tasks, state);
    }
  }
};
```

## 画面と保存処理

`App` は起動時に一度だけ保存データを読み込みます。タスクの変更後は `revision` の変化を検知して保存します。列の絞り込みは表示状態であり、タスクデータを変更しないため、ここでは reducer の状態に含めません。

```tsx
import { useEffect, useReducer, useState } from "react";
import { STATUSES, type Status, type Task } from "./domain";
import { boardReducer } from "./reducer";
import { loadTasks, saveTasks } from "./storage";

const statusLabel: Record<Status, string> = {
  backlog: "Backlog",
  doing: "Doing",
  done: "Done",
};

export default function App() {
  const [{ tasks, revision }, dispatch] = useReducer(
    boardReducer,
    undefined,
    () => {
      const loaded = loadTasks();
      return { tasks: loaded.tasks, revision: 0 };
    },
  );

  const [warning] = useState(() => loadTasks().warning);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    if (revision > 0) {
      saveTasks(tasks);
    }
  }, [revision, tasks]);

  const addTask = () => {
    dispatch({
      type: "task/add",
      id: crypto.randomUUID(),
      title: newTitle,
      now: new Date().toISOString(),
    });
    setNewTitle("");
  };

  const visibleTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  return (
    <main>
      <h1>Pocket Queue</h1>

      {warning !== null && (
        <p role="alert">{warning}</p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          addTask();
        }}
      >
        <label>
          新しいタスク
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            minLength={1}
            maxLength={80}
            required
          />
        </label>
        <button type="submit">追加</button>
      </form>

      <label>
        表示する列
        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value as Status | "all")
          }
        >
          <option value="all">すべて</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel[status]}
            </option>
          ))}
        </select>
      </label>

      <section aria-label="タスクボード">
        {STATUSES.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={visibleTasks.filter((task) => task.status === status)}
            onMove={(id, nextStatus) =>
              dispatch({
                type: "task/move",
                id,
                status: nextStatus,
                now: new Date().toISOString(),
              })
            }
            onDelete={(id) => dispatch({ type: "task/delete", id })}
            onRename={(id, title) =>
              dispatch({
                type: "task/rename",
                id,
                title,
                now: new Date().toISOString(),
              })
            }
          />
        ))}
      </section>
    </main>
  );
}
```

上の例では初期化関数と警告表示で `loadTasks()` を二度呼んでいます。実装時は、最初に一度だけ結果を取得して初期状態と警告の両方に使う形にまとめてください。たとえば `useState(() => loadTasks())` で読み込み結果を保持してから reducer の初期値を作れば、読み込みは一度で済みます。

各タスクには、ドラッグ操作の代わりにもなる列移動ボタンを置きます。キーボード利用者が、ポインタ操作なしで移動できることが重要です。

```tsx
type TaskColumnProps = {
  status: Status;
  tasks: Task[];
  onMove: (id: string, status: Status) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

function TaskColumn({
  status,
  tasks,
  onMove,
  onRename,
  onDelete,
}: TaskColumnProps) {
  return (
    <section aria-labelledby={`${status}-heading`}>
      <h2 id={`${status}-heading`}>{statusLabel[status]}</h2>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <input
              aria-label={`${task.title} のタイトル`}
              defaultValue={task.title}
              minLength={1}
              maxLength={80}
              onBlur={(event) => onRename(task.id, event.target.value)}
            />

            <label>
              列を移動
              <select
                value={task.status}
                onChange={(event) =>
                  onMove(task.id, event.target.value as Status)
                }
              >
                {STATUSES.map((nextStatus) => (
                  <option key={nextStatus} value={nextStatus}>
                    {statusLabel[nextStatus]}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" onClick={() => onDelete(task.id)}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

列の移動に `<select>` を使うと、マウス、タッチ、キーボードのいずれでも操作できます。ドラッグ・アンド・ドロップを追加しない今回の範囲では、これが最小限で明確な操作です。タイトル編集は、`onBlur` だけにするとキーボード利用者が変更を確定しづらい場合があるため、実装時は「保存」ボタンまたは Enter での確定も用意すると扱いやすくなります。

## テスト

Vitest では reducer と保存データ検証を単体テストし、React Testing Library では利用者操作をテストします。テストは実装詳細ではなく、追加できること、列を移動すると表示が変わることを確認します。

`src/reducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { boardReducer } from "./reducer";

describe("boardReducer", () => {
  it("新しいタスクを backlog に追加する", () => {
    const state = boardReducer(
      { tasks: [], revision: 0 },
      {
        type: "task/add",
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "仕様を確認する",
        now: "2026-07-12T00:00:00.000Z",
      },
    );

    expect(state.tasks).toEqual([
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "仕様を確認する",
        status: "backlog",
        createdAt: "2026-07-12T00:00:00.000Z",
        updatedAt: "2026-07-12T00:00:00.000Z",
      },
    ]);
    expect(state.revision).toBe(1);
  });

  it("タスクを別の列へ移動し updatedAt を更新する", () => {
    const state = boardReducer(
      {
        revision: 0,
        tasks: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            title: "仕様を確認する",
            status: "backlog",
            createdAt: "2026-07-12T00:00:00.000Z",
            updatedAt: "2026-07-12T00:00:00.000Z",
          },
        ],
      },
      {
        type: "task/move",
        id: "123e4567-e89b-12d3-a456-426614174000",
        status: "doing",
        now: "2026-07-12T01:00:00.000Z",
      },
    );

    expect(state.tasks[0]).toMatchObject({
      status: "doing",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });
  });
});
```

保存データの検証では、壊れたJSONと不正な形のJSONの両方を確認します。

```ts
import { afterEach, describe, expect, it } from "vitest";
import { loadTasks } from "./storage";

afterEach(() => {
  localStorage.clear();
});

describe("loadTasks", () => {
  it("壊れた JSON を空のボードと警告に変換する", () => {
    localStorage.setItem("pocket-queue:v1", "{not-json");

    expect(loadTasks()).toEqual({
      tasks: [],
      warning: "保存済みのデータを読み込めませんでした。空のボードを表示しています。",
    });
  });

  it("必須フィールドがない保存データを拒否する", () => {
    localStorage.setItem(
      "pocket-queue:v1",
      JSON.stringify([{ id: "123e4567-e89b-12d3-a456-426614174000" }]),
    );

    expect(loadTasks().tasks).toEqual([]);
    expect(loadTasks().warning).not.toBeNull();
  });
});
```

画面のテストでは `userEvent` を使い、入力、追加、列選択という利用者の操作を通して確認します。

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import App from "./App";

it("タスクを追加できる", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByLabelText("新しいタスク"), "買い物をする");
  await user.click(screen.getByRole("button", { name: "追加" }));

  expect(screen.getByDisplayValue("買い物をする")).toBeInTheDocument();
});

it("選択操作でタスクを doing 列へ移動できる", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByLabelText("新しいタスク"), "買い物をする");
  await user.click(screen.getByRole("button", { name: "追加" }));

  await user.selectOptions(
    screen.getByLabelText("列を移動"),
    "doing",
  );

  const doing = screen.getByRole("heading", { name: "Doing" }).parentElement;
  expect(doing).toHaveTextContent("買い物をする");
});
```

実装の完了条件は、3列のタスク表示と絞り込み、追加・編集・移動・削除、状態変更後の保存、壊れた保存データからの警告付き復帰、そしてキーボードによる列移動がすべて動作することです。サーバー連携、認証、同期、外部ドラッグ・アンド・ドロップライブラリは今回の対象に含めません。