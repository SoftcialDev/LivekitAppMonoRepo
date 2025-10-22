import { Context } from "@azure/functions";
import { z } from "zod";
import { withPathValidation } from "../../../shared/middleware/pathValidation";
import { TestHelpers } from "../../utils/helpers";

// Mock response utility
jest.mock("../../../shared/utils/response", () => ({
  badRequest: jest.fn((ctx: Context, message: string) => {
    ctx.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: message }
    };
    return Promise.resolve();
  })
}));

describe("pathValidation middleware", () => {
  let mockContext: Context;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = TestHelpers.createMockContext();
    mockHandler = jest.fn().mockResolvedValue(undefined);
  });

  describe("withPathValidation", () => {
    it("should validate path parameters successfully", async () => {
      const schema = z.object({
        id: z.string(),
        type: z.string()
      });

      // Mock path parameters in bindings
      (mockContext as any).bindings = {
        params: {
          id: "123",
          type: "user"
        }
      };

      await withPathValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockContext, {
        id: "123",
        type: "user"
      });
    });

    it("should extract path parameters from req.params when bindings.params is empty", async () => {
      const schema = z.object({
        id: z.string()
      });

      // Mock empty bindings.params but with req.params
      (mockContext as any).bindings = { params: {} };
      mockContext.req = {
        params: {
          id: "456"
        }
      } as any;

      await withPathValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockContext, {
        id: "456"
      });
    });

    it("should extract path parameters from req.params when bindings.params is undefined", async () => {
      const schema = z.object({
        id: z.string()
      });

      // Mock undefined bindings.params but with req.params
      (mockContext as any).bindings = {};
      mockContext.req = {
        params: {
          id: "789"
        }
      } as any;

      await withPathValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockContext, {
        id: "789"
      });
    });

    it("should handle empty params object", async () => {
      const schema = z.object({});

      (mockContext as any).bindings = { params: {} };

      await withPathValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockContext, {});
    });


    it("should handle handler throwing an error", async () => {
      const schema = z.object({
        id: z.string()
      });
      const handlerError = new Error("Handler error");

      (mockContext as any).bindings = {
        params: {
          id: "123"
        }
      };

      mockHandler.mockRejectedValue(handlerError);

      await expect(withPathValidation(mockContext, schema, mockHandler))
        .rejects.toThrow(handlerError);
    });

    it("should handle non-ZodError exceptions", async () => {
      const schema = z.object({
        id: z.string()
      });
      const nonZodError = new Error("Non-Zod error");

      // Mock schema.parse to throw non-ZodError
      const originalParse = schema.parse;
      schema.parse = jest.fn().mockImplementation(() => {
        throw nonZodError;
      });

      (mockContext as any).bindings = {
        params: {
          id: "123"
        }
      };

      await expect(withPathValidation(mockContext, schema, mockHandler))
        .rejects.toThrow(nonZodError);

      // Restore original parse
      schema.parse = originalParse;
    });

    it("should handle complex schema validation", async () => {
      const schema = z.object({
        id: z.string().uuid(),
        type: z.enum(["user", "admin", "supervisor"]),
        active: z.boolean(),
        metadata: z.object({
          created: z.string().datetime(),
          tags: z.array(z.string())
        }).optional()
      });

      (mockContext as any).bindings = {
        params: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          type: "admin",
          active: true,
          metadata: {
            created: "2023-01-01T00:00:00Z",
            tags: ["important", "urgent"]
          }
        }
      };

      await withPathValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockContext, {
        id: "550e8400-e29b-41d4-a716-446655440000",
        type: "admin",
        active: true,
        metadata: {
          created: "2023-01-01T00:00:00Z",
          tags: ["important", "urgent"]
        }
      });
    });

    it("should handle optional fields", async () => {
      const schema = z.object({
        id: z.string(),
        optional: z.string().optional()
      });

      (mockContext as any).bindings = {
        params: {
          id: "123"
          // optional field missing
        }
      };

      await withPathValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockContext, {
        id: "123",
        optional: undefined
      });
    });

    it("should handle default values", async () => {
      const schema = z.object({
        id: z.string(),
        status: z.string().default("active")
      });

      (mockContext as any).bindings = {
        params: {
          id: "123"
          // status field missing, should use default
        }
      };

      await withPathValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockContext, {
        id: "123",
        status: "active"
      });
    });

    it("should handle transform operations", async () => {
      const schema = z.object({
        id: z.string().transform(val => val.toUpperCase()),
        count: z.string().transform(val => parseInt(val, 10))
      });

      (mockContext as any).bindings = {
        params: {
          id: "abc",
          count: "42"
        }
      };

      await withPathValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(mockContext, {
        id: "ABC",
        count: 42
      });
    });
  });
});
