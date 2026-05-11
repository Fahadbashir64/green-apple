import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { getUserProfile, loginUser, registerUser } from "../services/auth.service.js";

async function register(req, res) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const user = await registerUser(parsed.data);
    return res.status(201).json(user);
  } catch {
    return res.status(409).json({ message: "User already exists" });
  }
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  const auth = await loginUser(parsed.data);
  if (!auth) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json(auth);
}

async function me(req, res) {
  const user = await getUserProfile(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(user);
}

export { register, login, me };
