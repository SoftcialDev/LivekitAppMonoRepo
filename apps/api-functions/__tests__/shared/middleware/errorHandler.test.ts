import { Context } from "@azure/functions";
import { withErrorHandler, ExpectedError, ErrorHandlerOptions } from "../../../shared/middleware/errorHandler";
import { TestHelpers } from "../../utils/helpers";

// Mock config
jest.mock("../../../shared/config", () => ({
  config: {
    node_env: "test"
  }
}));

describe("errorHandler middleware", () => {
  let mockContext: Context;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = TestHelpers.createMockContext();
    mockHandler = jest.fn();
  });

  describe("ExpectedError", () => {
    it("should create ExpectedError with message and status code", () => {
      const error = new ExpectedError("Test error", 400);
      
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("ExpectedError");
      expect(error.details).toBeUndefined();
    });

    it("should create ExpectedError with default status code 400", () => {
      const error = new ExpectedError("Test error");
      
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(400);
    });

    it("should create ExpectedError with details", () => {
      const details = { field: "value" };
      const error = new ExpectedError("Test error", 422, details);
      
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual(details);
    });
  });

  describe("withErrorHandler", () => {
    it("should execute handler successfully without errors", async () => {
      mockHandler.mockResolvedValue(undefined);
      
      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockHandler).toHaveBeenCalledWith(mockContext);
      expect(mockContext.res).toEqual({});
    });

    it("should handle ExpectedError and return 4xx response", async () => {
      const expectedError = new ExpectedError("Validation failed", 400);
      mockHandler.mockRejectedValue(expectedError);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        {
          event: "ExpectedError",
          message: expectedError.message,
          statusCode: expectedError.statusCode,
          details: expectedError.details
        },
        "Expected error thrown by handler"
      );

      expect(mockContext.res).toEqual({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: { error: "Validation failed" }
      });
    });

    it("should handle ExpectedError with details", async () => {
      const details = { field: "email", message: "Invalid format" };
      const expectedError = new ExpectedError("Validation failed", 422, details);
      mockHandler.mockRejectedValue(expectedError);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res).toEqual({
        status: 422,
        headers: { "Content-Type": "application/json" },
        body: { 
          error: "Validation failed",
          details: details
        }
      });
    });

    it("should not override response if already set for ExpectedError", async () => {
      const expectedError = new ExpectedError("Validation failed", 400);
      mockHandler.mockRejectedValue(expectedError);
      
      // Pre-set response
      mockContext.res = { status: 200, body: { success: true } };

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res).toEqual({ status: 200, body: { success: true } });
      expect(mockContext.log.warn).toHaveBeenCalledWith(
        "Response already populated before ExpectedError; skipping override"
      );
    });

    it("should handle Error and return 500 response", async () => {
      const error = new Error("Unexpected error");
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        {
          event: "UnhandledError",
          message: error.message,
          stack: error.stack
        },
        "Unhandled exception in function"
      );

      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Internal Server Error" }
      });
    });

    it("should handle non-Error thrown value", async () => {
      const nonError = "String error";
      mockHandler.mockRejectedValue(nonError);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        {
          event: "UnhandledNonError",
          error: "String error"
        },
        "Non-Error thrown in function"
      );

      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Internal Server Error" }
      });
    });

    it("should not override response if already set for unexpected error", async () => {
      const error = new Error("Unexpected error");
      mockHandler.mockRejectedValue(error);
      
      // Pre-set response
      mockContext.res = { status: 200, body: { success: true } };

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res).toEqual({ status: 200, body: { success: true } });
      expect(mockContext.log.warn).toHaveBeenCalledWith(
        "Response already populated; skipping setting 500 response"
      );
    });

    it("should include stack trace in development when showStackInDev is true", async () => {
      const error = new Error("Unexpected error");
      mockHandler.mockRejectedValue(error);

      const options: ErrorHandlerOptions = {
        showStackInDev: true,
        isProd: () => false
      };

      const wrappedHandler = withErrorHandler(mockHandler, options);
      await wrappedHandler(mockContext);

      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { 
          error: "Internal Server Error",
          stack: error.stack
        }
      });
    });

    it("should not include stack trace in production", async () => {
      const error = new Error("Unexpected error");
      mockHandler.mockRejectedValue(error);

      const options: ErrorHandlerOptions = {
        showStackInDev: true,
        isProd: () => true
      };

      const wrappedHandler = withErrorHandler(mockHandler, options);
      await wrappedHandler(mockContext);

      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Internal Server Error" }
      });
    });

    it("should use custom generic message", async () => {
      const error = new Error("Unexpected error");
      mockHandler.mockRejectedValue(error);

      const options: ErrorHandlerOptions = {
        genericMessage: "Something went wrong"
      };

      const wrappedHandler = withErrorHandler(mockHandler, options);
      await wrappedHandler(mockContext);

      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Something went wrong" }
      });
    });

    it("should rethrow error for non-HTTP triggers", async () => {
      const error = new Error("Unexpected error");
      mockHandler.mockRejectedValue(error);
      
      // Remove req to simulate non-HTTP trigger
      mockContext.req = undefined;

      const wrappedHandler = withErrorHandler(mockHandler);
      
      await expect(wrappedHandler(mockContext)).rejects.toThrow(error);
    });

    it("should handle ExpectedError for non-HTTP triggers", async () => {
      const expectedError = new ExpectedError("Validation failed", 400);
      mockHandler.mockRejectedValue(expectedError);
      
      // Remove req to simulate non-HTTP trigger
      mockContext.req = undefined;

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        {
          event: "ExpectedError",
          message: expectedError.message,
          statusCode: expectedError.statusCode,
          details: expectedError.details
        },
        "Expected error thrown by handler"
      );
    });

    it("should handle handler with additional arguments", async () => {
      const wrappedHandler = withErrorHandler(
        async (ctx: Context, arg1: string, arg2: number) => {
          expect(ctx).toBe(mockContext);
          expect(arg1).toBe("test");
          expect(arg2).toBe(42);
        }
      );

      await wrappedHandler(mockContext, "test", 42);
    });

    it("should handle handler with additional arguments and errors", async () => {
      const error = new Error("Handler error");
      const wrappedHandler = withErrorHandler(
        async (ctx: Context, arg1: string, arg2: number) => {
          throw error;
        }
      );

      await wrappedHandler(mockContext, "test", 42);

      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Internal Server Error" }
      });
    });

    it("should use custom isProd function", async () => {
      const customIsProd = jest.fn().mockReturnValue(true);
      const mockHandler = jest.fn().mockRejectedValue(new Error("Test error"));

      const wrappedHandler = withErrorHandler(mockHandler, {
        isProd: customIsProd,
        showStackInDev: true
      });

      await wrappedHandler(mockContext);

      expect(customIsProd).toHaveBeenCalled();
      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Internal Server Error" }
      });
    });

    it("should use default options when none provided", async () => {
      const error = new Error("Unexpected error");
      mockHandler.mockRejectedValue(error);

      const wrappedHandler = withErrorHandler(mockHandler);
      await wrappedHandler(mockContext);

      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Internal Server Error" }
      });
    });
  });
});
