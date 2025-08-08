import { AzureFunction, Context } from "@azure/functions";
import { handleCmDisconnect } from "../shared/handlers/contactManagerDisconnectHandler";
import { presenceAndStreamingHandler } from "../shared/handlers/presenceAndStreamingHandler";


/**
 * onDisconnected
 *
 * Entry point for Web PubSub "system/disconnected" events.
 *
 * 1) Calls presenceAndStreamingHandler to mark **everyone** offline & stop streaming.
 * 2) Calls handleCmDisconnect to additionally set CM → Unavailable + notify Employees.
 *
 * Both handlers internally check the event phase and userId; non-CM users are ignored
 * by handleCmDisconnect.
 *
 * @param context - Azure Functions execution context with `bindingData.connectionContext`.
 */
const onDisconnected: AzureFunction = async (context: Context) => {
  // 1) Generic presence + streaming logic for all users
  await presenceAndStreamingHandler(context);

  // 2) Additional Contact Manager logic (no-op for non-CMs)
  await handleCmDisconnect(context);
};

export default onDisconnected;
