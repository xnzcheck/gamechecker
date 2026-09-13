export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak dibenarkan"
    });
  }

  try {
    const body = req.body || {};

    const game = String(body.game || "").toLowerCase().trim();

    const id = String(
      body.id ||
      body.playerId ||
      body.uid ||
      ""
    ).trim();

    const zone = String(
      body.zone ||
      body.zoneId ||
      ""
    ).trim();

    const server = String(
      body.server ||
      body.region ||
      "SG"
    ).toUpperCase().trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID tidak dimasukkan"
      });
    }

    // =========================
    // MOBILE LEGENDS
    // =========================
    if (game === "ml" || game === "mlbb") {
      if (!zone) {
        return res.status(400).json({
          success: false,
          message: "Zone ID tidak dimasukkan"
        });
      }

      const url =
        "https://api.isan.eu.org/nickname/ml" +
        "?id=" + encodeURIComponent(id) +
        "&server=" + encodeURIComponent(zone) +
        "&decode=false";

      const response = await fetch(url);
      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        return res.status(502).json({
          success: false,
          message: "API Mobile Legends tidak sah"
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
        id: id,
        server: zone,
        name: String(nickname)
      });
    }

    // =========================
    // FREE FIRE
    // =========================
    if (game === "ff" || game === "freefire") {

      if (!/^[0-9]+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Player ID Free Fire mesti nombor sahaja"
        });
      }

      const ffServer =
        server === "ID" ? "ID" : "SG";

      const url =
        "https://freefireinfo-zy9l.onrender.com/api/v1/player-profile" +
        "?uid=" + encodeURIComponent(id) +
        "&server=" + encodeURIComponent(ffServer);

      let response;

      try {
        response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        });
      } catch (error) {
        console.error("FF CONNECTION ERROR:", error);

        return res.status(502).json({
          success: false,
          message: "Server Free Fire tidak dapat dihubungi"
        });
      }

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error(
          "FF RESPONSE BUKAN JSON:",
          text.substring(0, 500)
        );

        return res.status(502).json({
          success: false,
          message: "Server Free Fire sedang bermasalah. Cuba lagi."
        });
      }

      if (!response.ok) {
        console.error(
          "FF HTTP ERROR:",
          response.status,
          data
        );

        return res.status(502).json({
          success: false,
          message: "Player Free Fire tidak dapat disemak sekarang"
        });
      }

      // API ini menggunakan basicinfo
      const player =
        data?.basicinfo ||
        data?.basicInfo ||
        data?.data?.basicinfo ||
        data?.data?.basicInfo;

      if (!player) {
        console.error(
          "FF BASIC INFO TIADA:",
          data
        );

        return res.status(404).json({
          success: false,
          message: "Data Player Free Fire tidak dijumpai"
        });
      }

      const nickname =
        player?.nickname ||
        player?.nickName ||
        player?.name;

      if (!nickname) {
        return res.status(404).json({
          success: false,
          message: "Nickname Free Fire tidak dijumpai"
        });
      }

      return res.status(200).json({
        success: true,
        game: "ff",
        id: String(
          player?.accountid ||
          player?.accountId ||
          id
        ),
        server: String(
          player?.region ||
          ffServer
        ),
        name: String(nickname),
        level: player?.level || null
      });
    }

    return res.status(400).json({
      success: false,
      message: "Game tidak dikenali"
    });

  } catch (error) {
    console.error("CHECKER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server checker mengalami masalah"
    });
  }
}
