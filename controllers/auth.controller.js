import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client.js';

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m'});
}

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d'});
}

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: {email}});
    if (existingUser) {
      return res.status(400).json({message: 'User exists'});
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash= await (bcrypt.hash(password, salt));

    const user = await prisma.user.create({
      data: {
        name, 
        email,
        password_hash
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,    // Can't be accessed by JavaScript (prevents XSS attacks)
      secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production
      sameSite: 'strict', // Prevents CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000 // Cookie expires in 7 days (matches JWT expiry)
    });
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email}, accessToken});

  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: {email}});
    if (!existingUser) {
      return res.status(400).json({message: 'Invalid credentials'});
    }

    const passwordCorrect = await bcrypt.compare(password, existingUser.password_hash)
    if (!passwordCorrect) {
      return res.status(400).json({message: 'Invalid credentials'});
    }

    const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,    // Can't be accessed by JavaScript (prevents XSS attacks)
      secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production
      sameSite: 'strict', // Prevents CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000 // Cookie expires in 7 days (matches JWT expiry)
    });

    res.json({ user: { id: existingUser.id, name: existingUser.name, email: existingUser.email}, accessToken});

  } catch (error) {
    res.status(500).json({message: error.message});
  }
};

export const refresh = (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required'});
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const newAccessToken = generateAccessToken({ id: decoded.id, email: decoded.email });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};