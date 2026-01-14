describe('PrismaClientService', () => {
    const baseEnv = { ...process.env };
  
    function setEnv() {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.LIVEKIT_API_URL = 'https://livekit.example.com';
      process.env.LIVEKIT_API_KEY = 'lk_key';
      process.env.LIVEKIT_API_SECRET = 'lk_secret';
      process.env.SERVICE_BUS_CONNECTION =
        'Endpoint=sb://example/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=abc';
      process.env.WEBPUBSUB_ENDPOINT = 'https://wps.example.com';
      process.env.WEBPUBSUB_KEY = 'wps_key';
      process.env.WEBPUBSUB_HUB = 'hub';
      process.env.AZURE_TENANT_ID = '11111111-1111-1111-1111-111111111111';
      process.env.AZURE_CLIENT_ID = '22222222-2222-2222-2222-222222222222';
      process.env.AZURE_CLIENT_SECRET = 'secret';
      process.env.SERVICE_BUS_TOPIC_NAME = 'topic';
      process.env.NODE_ENV = 'test';
      process.env.AZURE_AD_API_IDENTIFIER_URI = 'https://api.example.com';
      process.env.SERVICE_PRINCIPAL_OBJECT_ID = 'sp_object_id';
      process.env.COMMANDS_SUBSCRIPTION_NAME = 'commands-sub';
      process.env.SNAPSHOT_CONTAINER_NAME = 'snapshots';
      process.env.RECORDINGS_CONTAINER_NAME = 'recordings';
    }
  
    function setup() {
      jest.resetModules();
      jest.clearAllMocks();
      jest.disableAutomock();
  
      process.env = { ...baseEnv };
      setEnv();
  
      const poolInstance = { end: jest.fn().mockResolvedValue(undefined) };
      const adapterInstance = { __adapter: true };
      const prismaInstance = { $disconnect: jest.fn().mockResolvedValue(undefined), user: {} };
  
      const PoolMock = jest.fn(() => poolInstance);
      const PrismaPgMock = jest.fn(() => adapterInstance);
      const PrismaClientMock = jest.fn(() => prismaInstance);
  
      jest.doMock('pg', () => ({ Pool: PoolMock }));
      jest.doMock('@prisma/adapter-pg', () => ({ PrismaPg: PrismaPgMock }));
      jest.doMock('@prisma/client', () => ({ PrismaClient: PrismaClientMock }));
  
      jest.unmock('../../../src/infrastructure/database/PrismaClientService');
      jest.unmock('../../../src/config');
      jest.unmock('../../../src/infrastructure/utils/LazySingletonProxy');
  
      let service: any;
  
      jest.isolateModules(() => {
        service = jest.requireActual('../../../src/infrastructure/database/PrismaClientService');
      });
  
      return {
        service,
        PoolMock,
        PrismaPgMock,
        PrismaClientMock,
        poolInstance,
        adapterInstance,
        prismaInstance,
      };
    }
  
    afterAll(() => {
      process.env = baseEnv;
    });
  
    it('loads the real module exports', () => {
      const { service } = setup();
  
      expect(service).toBeDefined();
      expect(service.getPrismaClient).toBeDefined();
      expect(typeof service.getPrismaClient).toBe('function');
      expect(jest.isMockFunction(service.getPrismaClient)).toBe(false);
    });
  
    it('returns a proxy client', () => {
      const { service } = setup();
      const client = service.getPrismaClient();
      expect(client).toBeDefined();
    });
  
    it('does not initialize until property access', () => {
      const { service, PoolMock, PrismaPgMock, PrismaClientMock } = setup();
  
      const client = service.getPrismaClient();
  
      expect(client).toBeDefined();
      expect(PoolMock).not.toHaveBeenCalled();
      expect(PrismaPgMock).not.toHaveBeenCalled();
      expect(PrismaClientMock).not.toHaveBeenCalled();
    });
  
    it('initializes on first property access', () => {
      const { service, PoolMock, PrismaPgMock, PrismaClientMock } = setup();
  
      const client = service.getPrismaClient();
      const _ = client.user;
  
      expect(_).toBeDefined();
      expect(PoolMock).toHaveBeenCalledTimes(1);
      expect(PrismaPgMock).toHaveBeenCalledTimes(1);
      expect(PrismaClientMock).toHaveBeenCalledTimes(1);
    });
  
    it('uses connection string query parameters', () => {
      const { service, PoolMock } = setup();
  
      const client = service.getPrismaClient();
      const _ = client.user;
  
      expect(PoolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: expect.stringContaining('connection_limit=400'),
        })
      );
      expect(PoolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: expect.stringContaining('pool_timeout=20'),
        })
      );
      expect(PoolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionString: expect.stringContaining('connect_timeout=10'),
        })
      );
    });
  
    it('configures pool settings', () => {
      const { service, PoolMock } = setup();
  
      const client = service.getPrismaClient();
      const _ = client.user;
  
      expect(PoolMock).toHaveBeenCalledWith(
        expect.objectContaining({
          max: 400,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 20000,
        })
      );
    });
  
    it('creates adapter and PrismaClient with expected options', () => {
      const { service, PrismaPgMock, PrismaClientMock, poolInstance, adapterInstance } = setup();
  
      const client = service.getPrismaClient();
      const _ = client.user;
  
      expect(PrismaPgMock).toHaveBeenCalledWith(poolInstance);
      expect(PrismaClientMock).toHaveBeenCalledWith({
        adapter: adapterInstance,
        log: ['error', 'warn'],
        errorFormat: 'pretty',
      });
    });
  
    it('does not re-initialize on subsequent access', () => {
      const { service, PoolMock, PrismaPgMock, PrismaClientMock } = setup();
  
      const a = service.getPrismaClient();
      const _a = a.user;
  
      const b = service.getPrismaClient();
      const _b = b.user;
  
      expect(_a).toBeDefined();
      expect(_b).toBeDefined();
      expect(PoolMock).toHaveBeenCalledTimes(1);
      expect(PrismaPgMock).toHaveBeenCalledTimes(1);
      expect(PrismaClientMock).toHaveBeenCalledTimes(1);
    });
  
    it('re-initializes after reset', () => {
      const { service, PoolMock, PrismaPgMock, PrismaClientMock } = setup();
  
      const client = service.getPrismaClient();
      const _1 = client.user;
  
      (client as any).reset();
  
      const _2 = client.user;
  
      expect(_1).toBeDefined();
      expect(_2).toBeDefined();
      expect(PoolMock).toHaveBeenCalledTimes(2);
      expect(PrismaPgMock).toHaveBeenCalledTimes(2);
      expect(PrismaClientMock).toHaveBeenCalledTimes(2);
    });
  
    it('binds instance methods', async () => {
      const { service, prismaInstance } = setup();
  
      const client = service.getPrismaClient();
      const _ = client.user;
  
      await client.$disconnect();
  
      expect(prismaInstance.$disconnect).toHaveBeenCalledTimes(1);
    });
  
    it('default export matches getPrismaClient()', () => {
      const { service } = setup();
  
      const a = service.default;
      const b = service.getPrismaClient();
  
      expect(a).toBe(b);
    });
  });
  