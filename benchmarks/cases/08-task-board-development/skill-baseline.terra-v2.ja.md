# Pocket Queue 開発ガイド

Pocket Queue は、端末内だけで使う1画面のタスクボードです。React 19、Vite 7、TypeScript の `strict` モードで実装し、タスク状態は reducer に集約します。サーバー、認証、同期、外部のドラッグ・アンド・ドロップライブラリは扱いません。

画面では `backlog`、`doing`、`done` の3列を表示します。カードには列を選ぶ操作を置き、マウス操作に頼らずキーボードでも確実に列を移動できるようにします。

## 構成

責務を次の3つに分けます。

- `domain/task.ts`: タスク型、状態遷移、reducer
- `storage/boardStorage.ts`: `localStorage` の読み書きと保存データの検証
- `App.tsx` と画面部品: 入力、表示、絞り込み、reducer の呼び出し

保存形式にはバージョンを持たせます。保存キーは仕様どおり `pocket-queue:v1` とします。

```ts
// domain/task.ts
export const statuses = ['backlog', 'doing', 'done'] as const;

export type TaskStatus = (typeof statuses)[number];

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export function isTaskTitle(value: string): boolean {
  return value.length >= 1 && value.length <= 80;
}
```

日時は `new Date().toISOString()` で作る ISO 8601 文字列に統一します。UUID の生成は、タスク追加時に `crypto.randomUUID()` を使います。

## reducer に状態変更を集約する

reducer は副作用を持たず、追加・編集・移動・削除だけを扱います。時刻と UUID は action に渡すため、テストでは固定値を使えます。

```ts
// domain/task.ts
export type BoardAction =
  | { type: 'task/add'; id: string; title: string; at: string }
  | { type: 'task/rename'; id: string; title: string; at: string }
  | { type: 'task/move'; id: string; status: TaskStatus; at: string }
  | { type: 'task/remove'; id: string };

export function boardReducer(tasks: Task[], action: BoardAction): Task[] {
  switch (action.type) {
    case 'task/add': {
      if (!isTaskTitle(action.title)) return tasks;

      return [
        ...tasks,
        {
          id: action.id,
          title: action.title,
          status: 'backlog',
          createdAt: action.at,
          updatedAt: action.at,
        },
      ];
    }

    case 'task/rename': {
      if (!isTaskTitle(action.title)) return tasks;

      return tasks.map((task) =>
        task.id === action.id
          ? { ...task, title: action.title, updatedAt: action.at }
          : task,
      );
    }

    case 'task/move':
      return tasks.map((task) =>
        task.id === action.id && task.status !== action.status
          ? { ...task, status: action.status, updatedAt: action.at }
          : task,
      );

    case 'task/remove':
      return tasks.filter((task) => task.id !== action.id);
  }
}
```

画面側で action を作る小さな関数を用意すると、UUID と更新時刻の扱いが散りません。

```ts
const now = () => new Date().toISOString();

function addTask(title: string) {
  dispatch({
    type: 'task/add',
    id: crypto.randomUUID(),
    title,
    at: now(),
  });
}
```

タイトル入力には `minLength={1}` と `maxLength={80}` を設定します。ただし入力属性だけに任せず、reducer でも検証して不正な状態を保存しないようにします。

## 保存と検証を分離する

`localStorage` は文字列しか保存できず、利用者や古い版のアプリによって壊れた値が残る可能性があります。JSON として読めることだけでは十分ではないため、保存形式と各タスクを検証します。

```ts
// storage/boardStorage.ts
import { statuses, type Task, type TaskStatus } from '../domain/task';

const storageKey = 'pocket-queue:v1';

type StoredBoard = {
  version: 1;
  tasks: Task[];
};

type LoadResult = {
  tasks: Task[];
  warning?: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' &&
    (statuses as readonly string[]).includes(value);
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    uuidPattern.test(value.id) &&
    typeof value.title === 'string' &&
    value.title.length >= 1 &&
    value.title.length <= 80 &&
    isStatus(value.status) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  );
}

export function decodeStoredBoard(raw: string): Task[] | null {
  try {
    const value: unknown = JSON.parse(raw);

    if (
      !isRecord(value) ||
      value.version !== 1 ||
      !Array.isArray(value.tasks) ||
      !value.tasks.every(isTask)
    ) {
      return null;
    }

    const tasks = value.tasks;
    const ids = new Set(tasks.map((task) => task.id));
    return ids.size === tasks.length ? tasks : null;
  } catch {
    return null;
  }
}

export function loadBoard(): LoadResult {
  const raw = localStorage.getItem(storageKey);

  if (raw === null) {
    return { tasks: [] };
  }

  const tasks = decodeStoredBoard(raw);
  if (tasks !== null) {
    return { tasks };
  }

  return {
    tasks: [],
    warning: '保存されていたタスクを読み込めなかったため、空のボードを表示しています。',
  };
}

export function saveBoard(tasks: Task[]): void {
  const value: StoredBoard = { version: 1, tasks };
  localStorage.setItem(storageKey, JSON.stringify(value));
}
```

壊れた保存値を読み込んだ直後は、元の値を上書きしません。起動時に得た警告と「利用者による状態変更があったか」をアプリ状態として持ち、変更後だけ保存します。

```ts
// App.tsx の要点
import { useEffect, useReducer } from 'react';
import { boardReducer, type BoardAction, type Task } from './domain/task';
import { loadBoard, saveBoard } from './storage/boardStorage';

type AppState = {
  tasks: Task[];
  warning?: string;
  changedByUser: boolean;
};

type AppAction =
  | BoardAction
  | { type: 'storage/failure' };

function initialState(): AppState {
  const loaded = loadBoard();

  return {
    tasks: loaded.tasks,
    warning: loaded.warning,
    changedByUser: false,
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'storage/failure') {
    return {
      ...state,
      warning: '変更内容を端末に保存できませんでした。',
    };
  }

  const tasks = boardReducer(state.tasks, action);

  if (tasks === state.tasks) {
    return state;
  }

  return {
    ...state,
    tasks,
    changedByUser: true,
  };
}

export function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, initialState);

  useEffect(() => {
    if (!state.changedByUser) return;

    try {
      saveBoard(state.tasks);
    } catch {
      dispatch({ type: 'storage/failure' });
    }
  }, [state.tasks, state.changedByUser]);

  // ここでフォーム、フィルター、3列を描画する
  return null;
}
```

この構成では、壊れた値を検出した起動では `changedByUser` が `false` のため保存されません。利用者が追加、編集、移動、削除のいずれかを行った後に初めて、正しい形式のデータで保存値が置き換わります。

## 画面の組み立て

画面は次の順で置くと、1画面でも役割が分かれます。

1. タスク追加フォーム
2. 表示する列を選ぶ絞り込み
3. `backlog`、`doing`、`done` の列
4. 保存データを読めなかった場合の警告

絞り込みは表示だけに適用し、タスク自体の `status` は変更しません。

```ts
type Filter = 'all' | TaskStatus;

const visibleTasks =
  filter === 'all'
    ? state.tasks
    : state.tasks.filter((task) => task.status === filter);
```

各カードにはタイトル編集用のフォーム、削除ボタン、列を選ぶ `select` を置きます。`select` は Tab キーで到達でき、矢印キーで列を選べるため、キーボードだけでの列移動を満たします。

```tsx
<select
  aria-label={`${task.title} の列`}
  value={task.status}
  onChange={(event) =>
    dispatch({
      type: 'task/move',
      id: task.id,
      status: event.target.value as TaskStatus,
      at: new Date().toISOString(),
    })
  }
>
  <option value="backlog">Backlog</option>
  <option value="doing">Doing</option>
  <option value="done">Done</option>
</select>
```

ドラッグ操作は今回の必須機能にしません。後から独自実装する場合も、この `select` を残せば、操作方法がドラッグだけに限定されません。

## テスト

Vitest は `jsdom` 環境で動かし、React Testing Library のセットアップで `@testing-library/jest-dom/vitest` を読み込みます。テストは UI の見た目ではなく、状態変化と利用者操作を確認します。

reducer では、追加時の初期列と、移動時の `status`・`updatedAt` を確認します。

```ts
import { describe, expect, it } from 'vitest';
import { boardReducer } from './task';

describe('boardReducer', () => {
  it('追加したタスクを backlog に置く', () => {
    const tasks = boardReducer([], {
      type: 'task/add',
      id: '4c1f01c2-839c-4e15-8d0f-2a1a3b9c5e10',
      title: '設計を確認する',
      at: '2026-07-12T00:00:00.000Z',
    });

    expect(tasks).toEqual([
      {
        id: '4c1f01c2-839c-4e15-8d0f-2a1a3b9c5e10',
        title: '設計を確認する',
        status: 'backlog',
        createdAt: '2026-07-12T00:00:00.000Z',
        updatedAt: '2026-07-12T00:00:00.000Z',
      },
    ]);
  });

  it('タスクを別の列へ移動する', () => {
    const initial = [{
      id: '4c1f01c2-839c-4e15-8d0f-2a1a3b9c5e10',
      title: '設計を確認する',
      status: 'backlog' as const,
      createdAt: '2026-07-12T00:00:00.000Z',
      updatedAt: '2026-07-12T00:00:00.000Z',
    }];

    const tasks = boardReducer(initial, {
      type: 'task/move',
      id: initial[0].id,
      status: 'doing',
      at: '2026-07-12T01:00:00.000Z',
    });

    expect(tasks[0]).toMatchObject({
      status: 'doing',
      updatedAt: '2026-07-12T01:00:00.000Z',
    });
  });
});
```

保存データの検証は、JSON 構文エラーと、JSON ではあるが必要な形を満たさない値を分けずに `null` として扱えることを確認します。

```ts
import { expect, it } from 'vitest';
import { decodeStoredBoard } from './boardStorage';

it('壊れた JSON を拒否する', () => {
  expect(decodeStoredBoard('{')).toBeNull();
});

it('必須項目がない保存データを拒否する', () => {
  expect(decodeStoredBoard('{"version":1,"tasks":[{"title":"x"}]}')).toBeNull();
});
```

画面テストでは、利用者が追加し、列の選択を変える流れを確認します。

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { App } from './App';

it('追加したタスクをキーボード操作可能な列選択で移動できる', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByLabelText('タスク名'), 'テストを書く');
  await user.click(screen.getByRole('button', { name: '追加' }));

  const statusSelect = screen.getByLabelText('テストを書く の列');
  await user.selectOptions(statusSelect, 'doing');

  const doingColumn = screen.getByRole('region', { name: 'Doing' });
  expect(within(doingColumn).getByText('テストを書く')).toBeInTheDocument();
});
```

この範囲で、タスクの追加、タイトル編集、列移動、削除、列による絞り込み、起動時の復元と変更後の保存を実装できます。通知、同期、共有、期限、並び替え、ドラッグ操作の高度化は今回の対象外として扱います。