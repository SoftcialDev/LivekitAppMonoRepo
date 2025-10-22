import { Context } from "@azure/functions";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { withAuth } from "../../../shared/middleware/auth";
import { TestHelpers } from "../../utils/helpers";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("jwks-rsa");
jest.mock("../../../shared/config", () => ({
  config: {
    azureTenantId: "test-tenant-id",
    azureClientId: "test-client-id",
    node_env: "test"
  }
}));

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockJwksClient = jwksClient as jest.MockedFunction<typeof jwksClient>;

describe("auth middleware", () => {
  let mockContext: Context;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = TestHelpers.createMockContext();
    mockNext = jest.fn().mockResolvedValue(undefined);

    // Mock jwksClient
    const mockClient = {
      getSigningKey: jest.fn()
    };
    mockJwksClient.mockReturnValue(mockClient as any);
  });

  describe("withAuth", () => {
    it("should authenticate successfully with valid Bearer token", async () => {
      const mockToken = "valid.jwt.token";
      const mockPayload = {
        oid: "test-oid",
        upn: "test@example.com",
        roles: ["admin"]
      };

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, mockPayload);
      });

      await withAuth(mockContext, mockNext);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        mockToken,
        expect.any(Function),
        expect.objectContaining({
          issuer: expect.arrayContaining([
            "https://login.microsoftonline.com/test-tenant-id/v2.0",
            "https://sts.windows.net/test-tenant-id/"
          ]),
          audience: "test-client-id",
          algorithms: ["RS256"]
        }),
        expect.any(Function)
      );

      expect(mockContext.bindings.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should reject request with missing Authorization header", async () => {
      mockContext.req!.headers = {};

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Missing or invalid Authorization header" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with malformed Authorization header", async () => {
      mockContext.req!.headers = {
        authorization: "InvalidFormat token"
      };

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Missing or invalid Authorization header" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with Authorization header not starting with Bearer", async () => {
      mockContext.req!.headers = {
        authorization: "Basic dGVzdA=="
      };

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Missing or invalid Authorization header" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle case-insensitive Authorization header", async () => {
      const mockToken = "valid.jwt.token";
      const mockPayload = {
        oid: "test-oid",
        upn: "test@example.com",
        roles: ["admin"]
      };

      mockContext.req!.headers = {
        Authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, mockPayload);
      });

      await withAuth(mockContext, mockNext);

      expect(mockJwt.verify).toHaveBeenCalled();
      expect(mockContext.bindings.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 500 when Azure AD configuration is missing", async () => {
      // Mock config to return missing values
      const originalConfig = require("../../../shared/config").config;
      require("../../../shared/config").config = {
        azureTenantId: "",
        azureClientId: "",
        node_env: "test"
      };

      const mockToken = "valid.jwt.token";
      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Server configuration error" }
      });
      expect(mockNext).not.toHaveBeenCalled();

      // Restore original config
      require("../../../shared/config").config = originalConfig;
    });

    it("should return 401 when JWT verification fails", async () => {
      const mockToken = "invalid.jwt.token";
      const jwtError = new Error("Invalid token");

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(jwtError, undefined);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Unauthorized: Invalid token" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when JWT payload is string instead of object", async () => {
      const mockToken = "valid.jwt.token";

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, "string-payload");
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Unauthorized: Unexpected token payload type" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 401 when JWT payload is undefined", async () => {
      const mockToken = "valid.jwt.token";

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, undefined);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Unauthorized: Unexpected token payload type" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle JWT verification promise rejection", async () => {
      const mockToken = "valid.jwt.token";
      const jwtError = new Error("Token expired");

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(jwtError, undefined);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Unauthorized: Token expired" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should log verbose messages during authentication process", async () => {
      const mockToken = "valid.jwt.token";
      const mockPayload = {
        oid: "test-oid",
        upn: "test@example.com",
        roles: ["admin"]
      };

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, mockPayload);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.log.verbose).toHaveBeenCalledWith(
        "[withAuth] Starting authentication check"
      );
      expect(mockContext.log.verbose).toHaveBeenCalledWith(
        "[withAuth] Token extracted (first 20 chars)",
        { snippet: mockToken.slice(0, 20) }
      );
      expect(mockContext.log.verbose).toHaveBeenCalledWith(
        "[withAuth] Verifying JWT",
        expect.objectContaining({
          issuers: expect.any(Array),
          audience: "test-client-id"
        })
      );
      expect(mockContext.log.info).toHaveBeenCalledWith(
        "[withAuth] JWT validated",
        {
          oid: mockPayload.oid,
          upn: mockPayload.upn,
          roles: mockPayload.roles
        }
      );
    });

    it("should log warning for missing Authorization header", async () => {
      mockContext.req!.headers = {};

      await withAuth(mockContext, mockNext);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        "[withAuth] Missing or malformed Authorization header",
        { header: undefined }
      );
    });

    it("should log error for missing Azure AD configuration", async () => {
      const originalConfig = require("../../../shared/config").config;
      require("../../../shared/config").config = {
        azureTenantId: "",
        azureClientId: "",
        node_env: "test"
      };

      const mockToken = "valid.jwt.token";
      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      await withAuth(mockContext, mockNext);

      expect(mockContext.log.error).toHaveBeenCalledWith(
        "[withAuth] Azure AD configuration missing",
        { azureTenantId: "", azureClientId: "" }
      );

      // Restore original config
      require("../../../shared/config").config = originalConfig;
    });

    it("should log warning for JWT verification failure", async () => {
      const mockToken = "invalid.jwt.token";
      const jwtError = new Error("Invalid signature");

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(jwtError, undefined);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.log.warn).toHaveBeenCalledWith(
        "[withAuth] Token verification failed",
        {
          name: jwtError.name,
          message: jwtError.message,
          stack: jwtError.stack
        }
      );
    });

    it("should handle next() throwing an error", async () => {
      const mockToken = "valid.jwt.token";
      const mockPayload = {
        oid: "test-oid",
        upn: "test@example.com",
        roles: ["admin"]
      };
      const nextError = new Error("Handler error");

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      mockJwt.verify.mockImplementation((token, getKey, options, callback: any) => {
        callback(null, mockPayload);
      });

      mockNext.mockRejectedValue(nextError);

      await expect(withAuth(mockContext, mockNext)).rejects.toThrow(nextError);
    });

    it("should handle JWT header missing kid", async () => {
      const mockToken = "valid.jwt.token";

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      // Mock jwt.verify to call getKey function with header missing kid
      mockJwt.verify.mockImplementation((token, getKey: any, options, callback: any) => {
        // Call getKey with header missing kid
        getKey({}, callback);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Unauthorized: JWT header is missing 'kid'" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle JWKS client error", async () => {
      const mockToken = "valid.jwt.token";

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      // Mock jwt.verify to throw an error
      mockJwt.verify.mockImplementation((token, getKey: any, options, callback: any) => {
        callback(new Error("JWKS error"), undefined);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.res).toEqual({
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Unauthorized: JWKS error" }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle JWKS client success", async () => {
      const mockToken = "valid.jwt.token";
      const mockPayload = {
        oid: "test-oid",
        upn: "test@example.com",
        roles: ["admin"]
      };

      mockContext.req!.headers = {
        authorization: `Bearer ${mockToken}`
      };

      // Mock jwt.verify to succeed
      mockJwt.verify.mockImplementation((token, getKey: any, options, callback: any) => {
        callback(null, mockPayload);
      });

      await withAuth(mockContext, mockNext);

      expect(mockContext.bindings.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});