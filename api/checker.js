export default async function handler(req, res) {
  // Hanya terima POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak dibenarkan"
    });
  }

  try {
    const { game, id, zone, server } = req.body || {};

    // =========================
    // VALIDASI
    // =========================
    if (!game) {
      return res.status(400).json({
        success: false,
        message: "Game belum dipilih"
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID belum dimasukkan"
      });
    }

    // =========================
    // MOBILE LEGENDS
    // =========================
    if (game === "ml" || game === "mlbb") {
      if (!zone) {
        return res.status(400).json({
          success: false,
          message: "Zone ID diperlukan untuk Mobile Legends"
        });
      }

      const mlUrl =
        `https://api.isan.eu.org/nickname/ml?id=${encodeURIComponent(id)}` +
        `&server=${encodeURIComponent(zone)}&decode=false`;

      const response = await fetch(mlUrl);
      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        return res.status(502).json({
          success: false,
          message: "API Mobile Legends tidak mengembalikan JSON yang sah"
        });
      }

      const nickname =
        data?.name ||
        data?.nickname ||
        data?.username ||
        data?.data?.name ||
        data?.data?.nickname;

      if (!response.ok || !nickname) {
        return res.status(404).json({
          success: false,
          message: "ID Mobile Legends tidak dijumpai"
        });
      }

      return res.status(200).json({
        success: true,
        game: "ml",
        id: String(id),
        server: String(zone),
        name: nickname
      });
    }

    // =========================
    // FREE FIRE
    // =========================
    if (game === "ff" || game === "freefire") {
      const uid = String(id).trim();

      // Free Fire UID mesti nombor
      if (!/^\d+$/.test(uid)) {
        return res.status(400).json({
          success: false,
          message: "Player ID Free Fire mesti nombor sahaja"
        });
      }

      const selectedServer = String(server || "SG").toUpperCase();

      // Kita benarkan SG dan ID
      if (!["SG", "ID"].includes(selectedServer)) {
        return res.status(400).json({
          success: false,
          message: "Server Free Fire hanya SG atau ID"
        });
      }

      const ffUrl =
        `https://freefireinfo-zy9l.onrender.com/api/v1/player-profile` +
        `?uid=${encodeURIComponent(uid)}` +
        `&server=${encodeURIComponent(selectedServer)}`;

      // Timeout 15 saat
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      let response;

      try {
        response = await fetch(ffUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json"
          },
          signal: controller.signal
        });
      } catch (error) {
        clearTimeout(timeout);

        return res.status(502).json({
          success: false,
          message: "API Free Fire tidak dapat dihubungi sekarang. Cuba lagi."
        });
      }

      clearTimeout(timeout);

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        return res.status(502).json({
          success: false,
          message: "API Free Fire mengembalikan data yang tidak sah."
        });
      }

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          message: "API Free Fire sedang bermasalah. Cuba lagi."
        });
      }

      // API menggunakan basicinfo
      const player =
        data?.basicinfo ||
        data?.basicInfo ||
        data?.data?.basicinfo ||
        data?.data?.basicInfo;

      if (!player) {
        return res.status(404).json({
          success: false,
          message: "Player Free Fire tidak dijumpai."
        });
      }

      const nickname =
        player?.nickname ||
        player?.nickName ||
        player?.name;

      const accountId =
        player?.accountid ||
        player?.accountId ||
        uid;

      if (!nickname) {
        return res.status(404).json({
          success: false,
          message: "Nickname Free Fire tidak dijumpai."
        });
      }

      return res.status(200).json({
        success: true,
        game: "ff",
        id: String(accountId),
        server: player?.region || selectedServer,
        name: nickname,
        level: player?.level || null
      });
    }

    // =========================
    // GAME TIDAK DIKENALI
    // =========================
    return res.status(400).json({
      success: false,
      message: "Game tidak dikenali"
    });

  } catch (error) {
    console.error("CHECKER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server checker mengalami masalah. Cuba lagi."
    });
  }
    }
