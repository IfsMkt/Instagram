import { serve } from "../../shared/serve.ts";
import { getContent } from "../../shared/handlers.js";

export default serve(getContent);
