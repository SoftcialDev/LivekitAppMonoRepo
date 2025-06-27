import { ServiceBusClient, ServiceBusSender } from "@azure/service-bus";
import { config } from "../config/index";

/**
 * Creates a Service Bus client using the connection string from configuration.
 */
const sbClient = new ServiceBusClient(config.serviceBusConnection);

/**
 * Prepares a sender for the Service Bus topic specified in configuration.
 */
const sender: ServiceBusSender = sbClient.createSender(config.serviceBusTopicName);

/**
 * Sends an administrative command ("START" or "STOP") for a given employee via Service Bus.
 *
 * @param command - The operation to perform, either "START" or "STOP".
 * @param employeeEmail - Email address of the employee the command applies to.
 * @returns A promise that resolves when the message has been sent.
 * @throws Errors from the Service Bus SDK are propagated.
 */
export async function sendAdminCommand(
  command: "START" | "STOP",
  employeeEmail: string
): Promise<void> {
  const message = {
    body: {
      command,
      employeeEmail,
      timestamp: new Date().toISOString()
    },
    contentType: "application/json"
  };
  await sender.sendMessages(message);
}
