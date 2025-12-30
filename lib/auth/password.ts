import bcrypt from 'bcryptjs';

// bcrypt加密成本因子（越高越安全，但越慢）
const SALT_ROUNDS = 12;

/**
 * 加密密码
 * @param password 明文密码
 * @returns 加密后的密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param password 用户输入的明文密码
 * @param hash 存储的密码哈希
 * @returns 密码是否匹配
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns 是否符合强度要求（至少8位）
 */
export function validatePasswordStrength(password: string): boolean {
  return password.length >= 8;
}
