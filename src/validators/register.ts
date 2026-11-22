// src/validators/register.ts
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export function validateRegister(body: unknown): {
  errors: string[];
  values: RegisterInput;
} {
  const errors: string[] = [];
  const raw = (body ?? {}) as Record<string, unknown>;

  // Pastikan tipe data string dulu, sebelum memanggil .trim()
  const username = typeof raw.username === "string" ? raw.username.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const password = typeof raw.password === "string" ? raw.password : "";

  if (raw.username !== undefined && typeof raw.username !== "string") {
    errors.push("nama pengguna wajib berupa teks");
  } else if (username === "") {
    errors.push("nama pengguna wajib diisi");
  } else if (username.length < 3) {
    errors.push("nama pengguna minimal 3 karakter");
  } else if (username.length > 50) {
    errors.push("nama pengguna maksimal 50 karakter");
  }

  if (raw.email !== undefined && typeof raw.email !== "string") {
    errors.push("email wajib berupa teks");
  } else if (email === "") {
    errors.push("email wajib diisi");
  } else if (email.length > 255) {
    errors.push("email maksimal 255 karakter");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("format email tidak valid");
  }

  if (raw.password !== undefined && typeof raw.password !== "string") {
    errors.push("kata sandi wajib berupa teks");
  } else if (password === "") {
    errors.push("kata sandi wajib diisi");
  } else if (password.length < 8) {
    errors.push("kata sandi minimal 8 karakter");
  } else if (password.length > 72) {
    // bcrypt hanya memproses 72 byte pertama
    errors.push("kata sandi maksimal 72 karakter");
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push("kata sandi harus mengandung huruf dan angka");
  }

  return { errors, values: { username, email, password } };
}