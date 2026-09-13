module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }

    const { game, userId, zoneId, server } = req.body || {};

    if (!game || !userId) {
      return res.status(400).json({
        success: false,
        message: "ID tidak lengkap."
      });
    }

    // =========================
    // MOBILE LEGENDS
    // =========================
    if (game === "mlbb") {
      if (!zoneId) {
        return res.status(400).json({
          success: false,
          message: "Zone ID diperlukan untuk MLBB."
        });
      }

      const apiUrl =
        `https://api.isan.eu.org/nickname/ml` +
        `?id=${encodeURIComponent(userId)}` +
        `&server=${encodeURIComponent(zoneId)}` +
        `&decode=false`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok || data.success === false || !data.name) {
        return res.status(404).json({
          success: false,
          message: "ID MLBB tidak dijumpai."
        });
      }

      return res.status(200).json({
        success: true,
        game: "mlbb",
        id: data.id || userId,
        server: data.server || zoneId,
        name: data.name
      });
    }

    // =========================
    // FREE FIRE
    // =========================
    if (game === "ff") {
      if (!server || !["SG", "ID"].includes(server.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: "Server Free Fire hanya Singapore (SG) atau Indonesia (ID)."
        });
      }

      const selectedServer = server.toUpperCase();

      const apiUrl =
        `https://freefireinfo-zy9l.onrender.com/api/v1/player-profile` +
        `?uid=${encodeURIComponent(userId)}` +
        `&server=${encodeURIComponent(selectedServer)}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      const player = data.basicinfo;

      if (!response.ok || !player || !player.nickname) {
        return res.status(404).json({
          success: false,
          message: "ID Free Fire tidak dijumpai."
        });
      }

      return res.status(200).json({
        success: true,
        game: "ff",
        id: player.accountid || userId,
        server: player.region || selectedServer,
        name: player.nickname,
        createAt: player.createat || null
      });
    }

    return res.status(400).json({
      success: false,
      message: "Game tidak disokong."
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server API sedang bermasalah. Cuba lagi."
    });
  }
};
