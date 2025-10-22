import { GetPsosBySupervisorResponse } from '../../../../../shared/domain/value-objects/GetPsosBySupervisorResponse';

describe('GetPsosBySupervisorResponse', () => {
  describe('constructor', () => {
    it('should create response with PSOs array', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'Supervisor Two'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos).toBe(psos);
      expect(response.psos).toHaveLength(2);
    });

    it('should create response with empty PSOs array', () => {
      const response = new GetPsosBySupervisorResponse([]);

      expect(response.psos).toEqual([]);
      expect(response.psos).toHaveLength(0);
    });

    it('should create response with single PSO', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos).toBe(psos);
      expect(response.psos).toHaveLength(1);
    });

    it('should create response with many PSOs', () => {
      const psos = Array.from({ length: 100 }, (_, i) => ({
        email: `pso${i}@example.com`,
        supervisorName: `Supervisor ${i}`
      }));
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos).toBe(psos);
      expect(response.psos).toHaveLength(100);
    });
  });

  describe('withPsos factory method', () => {
    it('should create response with PSOs array', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'Supervisor Two'
        }
      ];
      const response = GetPsosBySupervisorResponse.withPsos(psos);

      expect(response.psos).toBe(psos);
      expect(response.psos).toHaveLength(2);
    });

    it('should create response with empty PSOs array', () => {
      const response = GetPsosBySupervisorResponse.withPsos([]);

      expect(response.psos).toEqual([]);
      expect(response.psos).toHaveLength(0);
    });

    it('should create response with single PSO', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        }
      ];
      const response = GetPsosBySupervisorResponse.withPsos(psos);

      expect(response.psos).toBe(psos);
      expect(response.psos).toHaveLength(1);
    });

    it('should create response with many PSOs', () => {
      const psos = Array.from({ length: 100 }, (_, i) => ({
        email: `pso${i}@example.com`,
        supervisorName: `Supervisor ${i}`
      }));
      const response = GetPsosBySupervisorResponse.withPsos(psos);

      expect(response.psos).toBe(psos);
      expect(response.psos).toHaveLength(100);
    });
  });

  describe('toPayload', () => {
    it('should convert to payload format', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'Supervisor Two'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);
      const payload = response.toPayload();

      expect(payload).toEqual({
        psos: psos
      });
    });

    it('should convert empty response to payload', () => {
      const response = new GetPsosBySupervisorResponse([]);
      const payload = response.toPayload();

      expect(payload).toEqual({
        psos: []
      });
    });

    it('should convert single PSO response to payload', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);
      const payload = response.toPayload();

      expect(payload).toEqual({
        psos: psos
      });
    });

    it('should return reference to PSOs array', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);
      const payload = response.toPayload();

      expect(payload.psos).toBe(psos); // Same reference
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      // Freeze the object to prevent runtime modifications
      Object.freeze(response);

      expect(() => {
        (response as any).psos = [];
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle PSOs with different email formats', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        },
        {
          email: 'pso2@company.com',
          supervisorName: 'Supervisor Two'
        },
        {
          email: 'pso3@subdomain.example.com',
          supervisorName: 'Supervisor Three'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos[0].email).toBe('pso1@example.com');
      expect(response.psos[1].email).toBe('pso2@company.com');
      expect(response.psos[2].email).toBe('pso3@subdomain.example.com');
    });

    it('should handle PSOs with different supervisor name formats', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'John Doe'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'Jane Smith'
        },
        {
          email: 'pso3@example.com',
          supervisorName: 'Dr. Johnson'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos[0].supervisorName).toBe('John Doe');
      expect(response.psos[1].supervisorName).toBe('Jane Smith');
      expect(response.psos[2].supervisorName).toBe('Dr. Johnson');
    });

    it('should handle PSOs with special characters in email', () => {
      const psos = [
        {
          email: 'pso+test@example.com',
          supervisorName: 'Supervisor One'
        },
        {
          email: 'pso.test@example.com',
          supervisorName: 'Supervisor Two'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos[0].email).toBe('pso+test@example.com');
      expect(response.psos[1].email).toBe('pso.test@example.com');
    });

    it('should handle PSOs with special characters in supervisor name', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'José María'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'François-Pierre'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos[0].supervisorName).toBe('José María');
      expect(response.psos[1].supervisorName).toBe('François-Pierre');
    });

    it('should handle PSOs with unicode characters', () => {
      const psos = [
        {
          email: 'pso-émojis-🚀@example.com',
          supervisorName: 'Supervisor émojis 🚀'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos[0].email).toBe('pso-émojis-🚀@example.com');
      expect(response.psos[0].supervisorName).toBe('Supervisor émojis 🚀');
    });

    it('should handle PSOs with long email addresses', () => {
      const longEmail = 'pso-' + 'a'.repeat(1000) + '@example.com';
      const psos = [
        {
          email: longEmail,
          supervisorName: 'Supervisor One'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos[0].email).toBe(longEmail);
    });

    it('should handle PSOs with long supervisor names', () => {
      const longName = 'Supervisor ' + 'a'.repeat(1000);
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: longName
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos[0].supervisorName).toBe(longName);
    });
  });

  describe('type safety', () => {
    it('should accept array of PSO objects', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos).toBeInstanceOf(Array);
      expect(response.psos[0]).toHaveProperty('email');
      expect(response.psos[0]).toHaveProperty('supervisorName');
      expect(typeof response.psos[0].email).toBe('string');
      expect(typeof response.psos[0].supervisorName).toBe('string');
    });

    it('should return object from toPayload', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);
      const payload = response.toPayload();

      expect(typeof payload).toBe('object');
      expect(payload).toHaveProperty('psos');
      expect(payload.psos).toBeInstanceOf(Array);
    });
  });

  describe('validation scenarios', () => {
    it('should handle supervisor with multiple PSOs scenario', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'John Doe'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'John Doe'
        },
        {
          email: 'pso3@example.com',
          supervisorName: 'John Doe'
        }
      ];
      const response = GetPsosBySupervisorResponse.withPsos(psos);

      expect(response.psos).toHaveLength(3);
      expect(response.psos[0].supervisorName).toBe('John Doe');
      expect(response.psos[1].supervisorName).toBe('John Doe');
      expect(response.psos[2].supervisorName).toBe('John Doe');
    });

    it('should handle supervisor with no PSOs scenario', () => {
      const response = GetPsosBySupervisorResponse.withPsos([]);

      expect(response.psos).toEqual([]);
      expect(response.psos).toHaveLength(0);
    });

    it('should handle supervisor with single PSO scenario', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Jane Smith'
        }
      ];
      const response = GetPsosBySupervisorResponse.withPsos(psos);

      expect(response.psos).toHaveLength(1);
      expect(response.psos[0].email).toBe('pso1@example.com');
      expect(response.psos[0].supervisorName).toBe('Jane Smith');
    });

    it('should handle different supervisors scenario', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor A'
        },
        {
          email: 'pso2@example.com',
          supervisorName: 'Supervisor B'
        },
        {
          email: 'pso3@example.com',
          supervisorName: 'Supervisor C'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos).toHaveLength(3);
      expect(response.psos[0].supervisorName).toBe('Supervisor A');
      expect(response.psos[1].supervisorName).toBe('Supervisor B');
      expect(response.psos[2].supervisorName).toBe('Supervisor C');
    });

    it('should handle PSOs with different email domains scenario', () => {
      const psos = [
        {
          email: 'pso1@example.com',
          supervisorName: 'Supervisor One'
        },
        {
          email: 'pso2@company.com',
          supervisorName: 'Supervisor Two'
        },
        {
          email: 'pso3@organization.org',
          supervisorName: 'Supervisor Three'
        }
      ];
      const response = new GetPsosBySupervisorResponse(psos);

      expect(response.psos[0].email).toBe('pso1@example.com');
      expect(response.psos[1].email).toBe('pso2@company.com');
      expect(response.psos[2].email).toBe('pso3@organization.org');
    });

    it('should handle large number of PSOs scenario', () => {
      const psos = Array.from({ length: 1000 }, (_, i) => ({
        email: `pso${i}@example.com`,
        supervisorName: `Supervisor ${i}`
      }));
      const response = GetPsosBySupervisorResponse.withPsos(psos);

      expect(response.psos).toHaveLength(1000);
      expect(response.psos[0].email).toBe('pso0@example.com');
      expect(response.psos[999].email).toBe('pso999@example.com');
    });
  });
});
