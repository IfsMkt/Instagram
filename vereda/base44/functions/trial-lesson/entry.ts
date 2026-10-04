import { serve } from "../../shared/serve.ts";
import { getTrialLesson } from "../../shared/handlers.js";

export default serve(getTrialLesson);
