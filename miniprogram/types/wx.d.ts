declare function App(options: { onLaunch?(): void }): void;

declare function Page<T extends Record<string, unknown>>(options: T): void;

declare function Component<T extends Record<string, unknown>>(options: T): void;

declare namespace WechatMiniprogram {
  interface BaseEvent {
    currentTarget: {
      dataset: Record<string, unknown>;
    };
  }

  interface TouchEvent extends BaseEvent {}

  interface CustomEvent<T = unknown> extends BaseEvent {
    detail: T;
  }

  interface Input extends BaseEvent {
    detail: {
      value: string;
    };
  }
}

declare const wx: {
  cloud?: {
    init(options: { traceUser: boolean }): void;
  };
  navigateTo(options: { url: string }): void;
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: unknown): void;
  removeStorageSync(key: string): void;
};
