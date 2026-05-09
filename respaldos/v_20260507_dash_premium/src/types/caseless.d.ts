declare module 'caseless' {
  export interface Caseless {
    set(name: string, value: any, clobber?: boolean): void;
    get(name: string): any;
    has(name: string): string | boolean;
    del(name: string): boolean;
  }
  function caseless(dict?: object): Caseless;
  export default caseless;
}
