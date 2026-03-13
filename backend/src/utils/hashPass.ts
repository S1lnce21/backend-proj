import bcrypt from "bcrypt";

export async function hashPass(pass: string): Promise<string> {
  return await bcrypt.hash(pass, 10);
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};