import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

export const createDefaultAdmin = async () => {
  try {
    // Vérifier si un admin existe déjà
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("✔️ Admin déjà existant");
      return;
    }

    // Si aucun admin → créer un admin par défaut
    const hashedPassword = await bcrypt.hash("admin1234", 10);

    const admin = new User({
      nom: "Super",
      prenom: "Admin",
      email,
      motDePasse: hashedPassword,
      role: "admin",
    });

    await admin.save();

    console.log("⚡ Admin par défaut créé : admin@admin.com / admin1234");
  } catch (err) {
    console.error("Erreur création admin :", err);
  }
};
