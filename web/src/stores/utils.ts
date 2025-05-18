import { createJSONStorage } from "jotai/utils";

export const globalStorage = createJSONStorage(() => sessionStorage);
