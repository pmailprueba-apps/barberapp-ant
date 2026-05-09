// Para resolvedor de tipos caseless (usado en headers HTTP)
// Importado por chat-view.tsx

declare module 'caseless' {
  interface Caseless {
    set(name: string, value: string | string[]): void;
    get(name: string): string | string[] | undefined;
    has(name: string): boolean;
    remove(name: string): void;
    headers(object?: Record<string, string>): Record<string, string>;
  }

  function caseless(dict?: Record<string, string>): Caseless;
  export = caseless;
}
