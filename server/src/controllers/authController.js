const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

/**
 * Handles Doctor Login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Doctor not found" });

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // 3. Create JWT Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // Session lasts 24 hours
    );

    // Return token and user info (to store name in localStorage)
    res.json({ 
      token, 
      user: { name: user.name, email: user.email, role: user.role }  
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
}

/**
 * Handles New Doctor Registration (The "Secret" Route)
 */
async function register(req, res) {
  try {
    const { email, password, name } = req.body;

    // 1. Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: "All fields (email, password, name) are required" });
    }

    // 2. Check if doctor already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 3. Hash the password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the new doctor in the database
    const newDoctor = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'DOCTOR' // Default role
      }
    });

    res.status(201).json({ 
      message: "Doctor account created successfully",
      user: { name: newDoctor.name, email: newDoctor.email }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Could not create doctor account" });
  }
}

module.exports = { 
  login, 
  register 
};