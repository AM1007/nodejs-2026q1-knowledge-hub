import { authRoutes, usersRoutes } from '../endpoints';

const createUserDto = {
  login: 'TEST_AUTH_LOGIN',
  password: 'Tu6!@#%&',
};

const getTokenAndUserId = async (request) => {
  const signupResponse = await request
    .post(authRoutes.signup)
    .set('Accept', 'application/json')
    .send(createUserDto);

  let mockUserId = signupResponse.body?.id;

  const {
    body: { accessToken: seedAdminToken },
  } = await request
    .post(authRoutes.login)
    .set('Accept', 'application/json')
    .send({ login: 'admin', password: 'admin123' });

  if (!seedAdminToken) {
    throw new Error('Authorization is not implemented');
  }

  const seedAdminHeaders = {
    Accept: 'application/json',
    Authorization: `Bearer ${seedAdminToken}`,
  };

  if (!mockUserId) {
    const allUsers = await request
      .get(usersRoutes.getAll)
      .set(seedAdminHeaders);

    const existing = allUsers.body.find?.(
      (u: any) => u.login === createUserDto.login,
    );

    if (!existing) {
      throw new Error('Authorization is not implemented');
    }

    mockUserId = existing.id;
  }

  await request
    .put(usersRoutes.update(mockUserId))
    .set(seedAdminHeaders)
    .send({ role: 'admin' });

  const {
    body: { accessToken, refreshToken },
  } = await request
    .post(authRoutes.login)
    .set('Accept', 'application/json')
    .send(createUserDto);

  if (!accessToken) {
    throw new Error('Authorization is not implemented');
  }

  const token = `Bearer ${accessToken}`;

  return {
    token,
    accessToken,
    refreshToken,
    mockUserId,
    login: createUserDto.login,
  };
};

export default getTokenAndUserId;
