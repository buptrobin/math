declare function App(options: { onLaunch?(): void }): void;

declare function Page(options: Record<string, unknown>): void;

declare const wx: {
  cloud?: {
    init(options: { traceUser: boolean }): void;
  };
};
