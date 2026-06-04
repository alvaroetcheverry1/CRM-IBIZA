jest.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: jest.fn(() => ({ name: 'google-auth' })),
      OAuth2: jest.fn(() => ({ setCredentials: jest.fn() })),
    },
    drive: jest.fn(() => 'drive-client'),
    sheets: jest.fn(() => 'sheets-client'),
  },
}));

describe('Google integration services', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('SheetsService should initialize with OAuth credentials when no service account path is set', async () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    process.env.GOOGLE_REFRESH_TOKEN = 'refresh-token';
    process.env.GOOGLE_SHEET_MASTER_ID = 'sheet-id';
    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

    const { SheetsService } = require('../sheetsService');
    const service = new SheetsService();

    expect(service.enabled).toBe(true);

    const client = await service.getClient();
    expect(client).toBe('sheets-client');
  });
});
