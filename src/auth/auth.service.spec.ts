import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const SECRETOS: Record<string, string> = {
  JWT_SECRET: 'secreto-de-acceso-solo-para-tests',
  JWT_REFRESH_SECRET: 'secreto-de-refresh-solo-para-tests',
};

const EMAIL = 'demo@shortcuts.dev';
const PASSWORD = 'demo12345';

const capturarError = (promesa: Promise<unknown>): Promise<Error> =>
  promesa.then(
    () => new Error('se esperaba un rechazo y resolvio'),
    (e: Error) => e,
  );

interface Payload {
  sub: string;
  email: string;
}

describe('AuthService', () => {
  let auth: AuthService;
  let jwt: JwtService;

  const users = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findProfile: jest.fn(),
    create: jest.fn(),
    setRefreshTokenHash: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    users.setRefreshTokenHash.mockResolvedValue(undefined);

    const modulo: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (clave: string) => SECRETOS[clave],
            get: (_clave: string, porDefecto: string) => porDefecto,
          },
        },
      ],
    }).compile();

    auth = modulo.get(AuthService);
    jwt = modulo.get(JwtService);
  });

  const registrarUsuarioNuevo = () => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockImplementation((data: { email: string }) =>
      Promise.resolve({ id: 'user-1', ...data }),
    );
    return auth.register({ email: EMAIL, password: PASSWORD, name: 'Demo' });
  };

  describe('register', () => {
    it('hashea la contraseña con bcrypt y nunca la guarda en texto plano', async () => {
      await registrarUsuarioNuevo();

      const [guardado] = users.create.mock.calls[0] as [{ password: string }];
      expect(guardado.password).not.toBe(PASSWORD);
      expect(guardado.password).toMatch(/^\$2[aby]\$/);
      await expect(bcrypt.compare(PASSWORD, guardado.password)).resolves.toBe(
        true,
      );
    });

    it('firma el access y el refresh con secretos distintos', async () => {
      const tokens = await registrarUsuarioNuevo();

      expect(
        jwt.verify<Payload>(tokens.accessToken, {
          secret: SECRETOS.JWT_SECRET,
        }),
      ).toMatchObject({ sub: 'user-1', email: EMAIL });

      // Si un solo secreto firmara ambos, filtrar el del access permitiria emitir refresh.
      expect(() => {
        jwt.verify<Payload>(tokens.refreshToken, {
          secret: SECRETOS.JWT_SECRET,
        });
      }).toThrow();

      expect(
        jwt.verify<Payload>(tokens.refreshToken, {
          secret: SECRETOS.JWT_REFRESH_SECRET,
        }),
      ).toMatchObject({ sub: 'user-1' });
    });

    it('persiste el refresh token hasheado, no el token crudo', async () => {
      const tokens = await registrarUsuarioNuevo();

      const [id, hash] = users.setRefreshTokenHash.mock.calls[0] as [
        string,
        string,
      ];
      expect(id).toBe('user-1');
      expect(hash).not.toBe(tokens.refreshToken);
      expect(hash).toBe(
        createHash('sha256').update(tokens.refreshToken).digest('hex'),
      );
    });

    it('rechaza un email ya registrado', async () => {
      users.findByEmail.mockResolvedValue({ id: 'user-1', email: EMAIL });

      await expect(
        auth.register({ email: EMAIL, password: PASSWORD }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const usuarioExistente = async () => ({
      id: 'user-1',
      email: EMAIL,
      password: await bcrypt.hash(PASSWORD, 12),
    });

    it('devuelve access y refresh con credenciales validas', async () => {
      users.findByEmail.mockResolvedValue(await usuarioExistente());

      const tokens = await auth.login({ email: EMAIL, password: PASSWORD });

      expect(tokens.accessToken).toEqual(expect.any(String));
      expect(tokens.refreshToken).toEqual(expect.any(String));
      expect(users.setRefreshTokenHash).toHaveBeenCalledTimes(1);
    });

    it('no revela si el email existe: mismo error para usuario inexistente y password incorrecta', async () => {
      users.findByEmail.mockResolvedValue(null);
      const errorSinUsuario = await capturarError(
        auth.login({ email: 'nadie@shortcuts.dev', password: PASSWORD }),
      );

      users.findByEmail.mockResolvedValue(await usuarioExistente());
      const errorPasswordMala = await capturarError(
        auth.login({ email: EMAIL, password: 'password-incorrecta' }),
      );

      expect(errorSinUsuario).toBeInstanceOf(UnauthorizedException);
      expect(errorPasswordMala).toBeInstanceOf(UnauthorizedException);
      expect(errorPasswordMala.message).toBe(errorSinUsuario.message);
    });

    it('sin usuario tarda igual: el tiempo de respuesta no revela si el email existe', async () => {
      users.findByEmail.mockResolvedValue(null);

      const inicio = Date.now();
      await expect(
        auth.login({ email: 'nadie@shortcuts.dev', password: PASSWORD }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // bcrypt cost 12 no baja de ~150ms: si cortara antes de comparar, esto seria casi 0.
      expect(Date.now() - inicio).toBeGreaterThan(50);
    });

    it('no emite tokens cuando la contraseña no coincide', async () => {
      users.findByEmail.mockResolvedValue(await usuarioExistente());

      await expect(
        auth.login({ email: EMAIL, password: 'password-incorrecta' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(users.setRefreshTokenHash).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rechaza un refresh token que no coincide con el hash guardado', async () => {
      users.findById.mockResolvedValue({
        id: 'user-1',
        email: EMAIL,
        refreshTokenHash: createHash('sha256')
          .update('otro-token')
          .digest('hex'),
      });

      await expect(
        auth.refresh('user-1', 'token-robado'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rechaza el refresh cuando la sesion fue cerrada', async () => {
      users.findById.mockResolvedValue({
        id: 'user-1',
        email: EMAIL,
        refreshTokenHash: null,
      });

      await expect(auth.refresh('user-1', 'cualquiera')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('borra el hash del refresh token', async () => {
      await auth.logout('user-1');

      expect(users.setRefreshTokenHash).toHaveBeenCalledWith('user-1', null);
    });
  });
});
