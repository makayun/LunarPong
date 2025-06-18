import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = (password: string) => bcrypt.hashSync(password, 10);
export const checkPassword = (password: string, hash: string) => bcrypt.compareSync(password, hash);
// export const signToken = (id: number, username: string) => jwt.sign({ id: id, username: username}, process.env.JWT_SECRET!, { expiresIn: '1h' });
export const sign2faToken = (id: number, username: string) => jwt.sign({ id: id, username: username }, process.env.JWT_SECRET!, { expiresIn: '310s' });
export const signAccessToken = (id: number, username: string) => jwt.sign({ id: id, username: username }, process.env.JWT_SECRET!, { expiresIn: '1d' });
export const signRefreshToken = (id: number, username: string) => jwt.sign({ id: id, username: username }, process.env.JWT_SECRET!, { expiresIn: '7d' });
export const verifyToken = (token: string) => jwt.verify(token, process.env.JWT_SECRET!);
