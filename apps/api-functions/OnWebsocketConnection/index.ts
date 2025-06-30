import { AzureFunction, Context } from "@azure/functions";
import { presenceAndStreamingHandler } from "../shared/handlers/presenceAndStreamingHandler"

const onConnect: AzureFunction = async (context: Context) => {
  // Delegates to shared handler – it already builds the HTTP response.
  console.log("Getting here in connection", context)
  await presenceAndStreamingHandler(context);
};

export default onConnect;
