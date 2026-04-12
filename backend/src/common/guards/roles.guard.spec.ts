import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const handler = jest.fn();
  const controllerClass = jest.fn();

  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let context: jest.Mocked<ExecutionContext>;
  let guard: RolesGuard;

  const createContext = (role: string): jest.Mocked<ExecutionContext> =>
    ({
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(controllerClass),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role },
        }),
      }),
    }) as unknown as jest.Mocked<ExecutionContext>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    context = createContext('patient');
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('should deny access when user role is patient and required roles are owner/admin', () => {
    reflector.getAllAndOverride.mockReturnValue(['owner', 'admin']);
    context = createContext('patient');

    expect(guard.canActivate(context)).toBe(false);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
      handler,
      controllerClass,
    ]);
  });

  it('should allow access when user role is admin and required roles are owner/admin', () => {
    reflector.getAllAndOverride.mockReturnValue(['owner', 'admin']);
    context = createContext('admin');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when no roles are required (getAllAndOverride returns undefined)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });
});
