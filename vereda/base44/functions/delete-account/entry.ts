import { serve } from "../../shared/serve.ts";
import { deleteAccount } from "../../shared/handlers.js";

export default serve(deleteAccount);
