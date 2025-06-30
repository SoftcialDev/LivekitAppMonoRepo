import { AzureFunction, Context } from "@azure/functions";
import { presenceAndStreamingHandler } from "../shared/handlers/presenceAndStreamingHandler"

const onDisconnect: AzureFunction = async (context: Context) => {
    console.log("Getting here in disconnection", context)
  await presenceAndStreamingHandler(context);
};

export default onDisconnect;
