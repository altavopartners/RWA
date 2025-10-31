import axios from "axios";
const nativeImport = (s: string) =>
  (Function("s", "return import(s)"))(s) as Promise<any>;
let _client: any | null = null;
