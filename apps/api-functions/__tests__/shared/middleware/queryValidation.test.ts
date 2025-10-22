import { Context } from "@azure/functions";
import { z } from "zod";
import { withQueryValidation } from "../../../shared/middleware/queryValidation";
import { TestHelpers } from "../../utils/helpers";

// Mock response utility
jest.mock("../../../shared/utils/response", () => ({
  badRequest: jest.fn((ctx: Context, message: string) => {
    ctx.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: message }
    };
  })
}));

describe("queryValidation middleware", () => {
  let mockContext: Context;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = TestHelpers.createMockContext();
    mockHandler = jest.fn().mockResolvedValue(undefined);
  });

  describe("withQueryValidation", () => {
    it("should validate query parameters successfully", async () => {
      const schema = z.object({
        page: z.string().transform(val => parseInt(val, 10)),
        limit: z.string().transform(val => parseInt(val, 10)),
        search: z.string().optional()
      });

      mockContext.req = {
        query: {
          page: "1",
          limit: "10",
          search: "test"
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "test"
      });
    });

    it("should handle empty query object", async () => {
      const schema = z.object({});

      mockContext.req = {
        query: {}
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({});
    });

    it("should handle undefined query", async () => {
      const schema = z.object({});

      mockContext.req = {
        query: undefined
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({});
    });

    it("should handle missing req object", async () => {
      const schema = z.object({});

      mockContext.req = undefined;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({});
    });

    it("should handle validation errors and return bad request", async () => {
      const schema = z.object({
        page: z.string().regex(/^\d+$/),
        limit: z.string().regex(/^\d+$/),
        status: z.enum(["active", "inactive"])
      });

      mockContext.req = {
        query: {
          page: "abc", // Invalid format
          limit: "10",
          status: "invalid" // Not in enum
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockContext.res).toEqual({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "Invalid query parameters: page: Invalid, status: Invalid enum value. Expected 'active' | 'inactive', received 'invalid'"
        }
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should handle nested validation errors", async () => {
      const schema = z.object({
        filters: z.object({
          dateRange: z.object({
            start: z.string().datetime(),
            end: z.string().datetime()
          })
        })
      });

      mockContext.req = {
        query: {
          filters: {
            dateRange: {
              start: "invalid-date",
              end: "2023-01-01T00:00:00Z"
            }
          }
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockContext.res).toEqual({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "Invalid query parameters: filters.dateRange.start: Invalid datetime"
        }
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should handle array validation errors", async () => {
      const schema = z.object({
        tags: z.array(z.string().min(2))
      });

      mockContext.req = {
        query: {
          tags: ["a", "valid-tag", "b"]
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockContext.res).toEqual({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "Invalid query parameters: tags.0: String must contain at least 2 character(s), tags.2: String must contain at least 2 character(s)"
        }
      });
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should handle handler throwing an error", async () => {
      const schema = z.object({
        id: z.string()
      });
      const handlerError = new Error("Handler error");

      mockContext.req = {
        query: {
          id: "123"
        }
      } as any;

      mockHandler.mockRejectedValue(handlerError);

      await expect(withQueryValidation(mockContext, schema, mockHandler))
        .rejects.toThrow(handlerError);
    });

    it("should handle optional fields", async () => {
      const schema = z.object({
        id: z.string(),
        optional: z.string().optional()
      });

      mockContext.req = {
        query: {
          id: "123"
          // optional field missing
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        id: "123",
        optional: undefined
      });
    });

    it("should handle default values", async () => {
      const schema = z.object({
        id: z.string(),
        status: z.string().default("active")
      });

      mockContext.req = {
        query: {
          id: "123"
          // status field missing, should use default
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        id: "123",
        status: "active"
      });
    });

    it("should handle transform operations", async () => {
      const schema = z.object({
        id: z.string().transform(val => val.toUpperCase()),
        count: z.string().transform(val => parseInt(val, 10)),
        active: z.string().transform(val => val === "true")
      });

      mockContext.req = {
        query: {
          id: "abc",
          count: "42",
          active: "true"
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        id: "ABC",
        count: 42,
        active: true
      });
    });

    it("should handle complex schema validation", async () => {
      const schema = z.object({
        page: z.string().transform(val => parseInt(val, 10)),
        limit: z.string().transform(val => parseInt(val, 10)),
        sortBy: z.enum(["name", "date", "status"]),
        order: z.enum(["asc", "desc"]).default("asc"),
        filters: z.object({
          status: z.enum(["active", "inactive"]).optional(),
          tags: z.array(z.string()).optional()
        }).optional()
      });

      mockContext.req = {
        query: {
          page: "1",
          limit: "20",
          sortBy: "name",
          order: "desc",
          filters: {
            status: "active",
            tags: ["important", "urgent"]
          }
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: "name",
        order: "desc",
        filters: {
          status: "active",
          tags: ["important", "urgent"]
        }
      });
    });

    it("should handle string to number transformations", async () => {
      const schema = z.object({
        id: z.string().transform(val => parseInt(val, 10)),
        price: z.string().transform(val => parseFloat(val)),
        quantity: z.string().transform(val => Number(val))
      });

      mockContext.req = {
        query: {
          id: "123",
          price: "19.99",
          quantity: "5"
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        id: 123,
        price: 19.99,
        quantity: 5
      });
    });

    it("should handle boolean transformations", async () => {
      const schema = z.object({
        active: z.string().transform(val => val === "true"),
        enabled: z.string().transform(val => val === "1"),
        visible: z.string().transform(val => val.toLowerCase() === "yes")
      });

      mockContext.req = {
        query: {
          active: "true",
          enabled: "1",
          visible: "YES"
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        active: true,
        enabled: true,
        visible: true
      });
    });

    it("should handle date transformations", async () => {
      const schema = z.object({
        date: z.string().transform(val => new Date(val)),
        timestamp: z.string().transform(val => new Date(val).getTime())
      });

      mockContext.req = {
        query: {
          date: "2023-01-01T00:00:00Z",
          timestamp: "2023-01-01T00:00:00Z"
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      const result = mockHandler.mock.calls[0][0];
      expect(result.date).toBeInstanceOf(Date);
      expect(result.timestamp).toBe(1672531200000);
    });

    it("should handle union types", async () => {
      const schema = z.object({
        type: z.union([z.literal("user"), z.literal("admin")]),
        status: z.union([z.string(), z.number()])
      });

      mockContext.req = {
        query: {
          type: "user",
          status: "active"
        }
      } as any;

      await withQueryValidation(mockContext, schema, mockHandler);

      expect(mockHandler).toHaveBeenCalledWith({
        type: "user",
        status: "active"
      });
    });
  });
});
