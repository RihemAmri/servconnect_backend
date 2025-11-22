import fetch from 'node-fetch';

// Reverse geocoding : lat, lon → adresse
export const reverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: "Latitude et longitude requises" });
    }

    // URL Nominatim
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

    // ⚠️ Ajouter un User-Agent pour Nominatim
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ServeConnectApp/1.0 (contact@votreemail.com)',
        'Accept-Language': 'fr'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: "Erreur Nominatim" });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Erreur reverseGeocode:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
