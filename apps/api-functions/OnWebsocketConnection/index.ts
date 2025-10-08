import { AzureFunction, Context } from "@azure/functions";
import { presenceAndStreamingHandler } from "../shared/handlers/presenceAndStreamingHandler"

const onConnect: AzureFunction = async (context: Context) => {
  // Delegates to shared handler – it already builds the HTTP response.
  await presenceAndStreamingHandler(context);
};

export default onConnect;
