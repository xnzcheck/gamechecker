module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }

    const { game, userId, zoneId } = req.body || {};

    if (!game || !userId) {
      return res.status(400).json({
        success: false,
        message: "Maklumat ID tidak lengkap."
      });
    }

    let apiUrl;

    if (game === "mlbb") {
      if (!zoneId) {
        return res.status(400).json({
          success: false,
          message: "Zone ID diperlukan untuk MLBB."
        });
      }

      apiUrl =
        `https://api.isan.eu.org/nickname/ml?id=${encodeURIComponent(userId)}` +
        `&server=${encodeURIComponent(zoneId)}&decode=false`;

    } else if (game === "ff") {
      apiUrl =
        `https://api.isan.eu.org/nickname/ff?id=${encodeURIComponent(userId)}` +
        `&decode=false`;

    } else {
      return res.status(400).json({
        success: false,
        message: "Game tidak disokong."
      });
    }

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok || data.success === false) {
      return res.status(404).json({
        success: false,
        message: data.message || "ID tidak dijumpai."
      });
    }

    return res.status(200).json({
      success: true,
      game: data.game || game,
      id: data.id || userId,
      server: data.server || zoneId || null,
      name: data.name || "Tidak diketahui"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server API sedang bermasalah. Cuba lagi."
    });
  }
};
