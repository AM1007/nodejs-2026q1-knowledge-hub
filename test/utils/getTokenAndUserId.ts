import { authRoutes } from '../endpoints';

const createUserDto = {
  login: 'TEST_AUTH_LOGIN',
  password: 'Tu6!@#%&',
};

const getTokenAndUserId = async (request) => {
  const {
    body: { id: mockUserId },
  } = await request
    .post(authRoutes.signup)
    .set('Accept', 'application/json')
    .send(createUserDto);

  if (mockUserId === undefined) {
    throw new Error('Authorization is not implemented');
  }

  const {
    body: { accessToken: seedAdminToken },
  } = await request
    .post(authRoutes.login)
    .set('Accept', 'application/json')
    .send({ login: 'admin', password: 'admin123' });

  await request
    .put(`/user/${mockUserId}`)
    .set({
      Accept: 'application/json',
      Authorization: `Bearer ${seedAdminToken}`,
    })
    .send({ role: 'admin' });

  const {
    body: { accessToken, refreshToken },
  } = await request
    .post(authRoutes.login)
    .set('Accept', 'application/json')
    .send(createUserDto);

  if (accessToken === undefined) {
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
