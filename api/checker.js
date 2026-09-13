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

    // ==============================
    // MOBILE LEGENDS
    // ==============================
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

      try {
        const response = await fetch(url);
        const text = await response.text();

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          return res.status(502).json({
            success: false,
            message: "API Mobile Legends tidak mengembalikan data sah"
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

      } catch (error) {
        console.error("ML ERROR:", error);

        return res.status(502).json({
          success: false,
          message: "API Mobile Legends tidak dapat dihubungi"
        });
      }
    }

    // ==============================
    // FREE FIRE
    // ==============================
    if (game === "ff" || game === "freefire") {

      if (!/^[0-9]+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Player ID Free Fire mesti nombor sahaja"
        });
      }

      const region = server === "ID" ? "ID" : "SG";

      const url =
        "https://ffdvinh09-info.vercel.app/player-info" +
        "?region=" + encodeURIComponent(region) +
        "&uid=" + encodeURIComponent(id);

      try {
        const response = await fetch(url);

        const text = await response.text();

        let data;

        try {
          data = JSON.parse(text);
        } catch {
          console.error("FF NON JSON:", text.substring(0, 300));

          return res.status(502).json({
            success: false,
            message: "Server Free Fire tidak mengembalikan data sah"
          });
        }

        if (!response.ok) {
          console.error("FF HTTP ERROR:", response.status, data);

          return res.status(502).json({
            success: false,
            message: "Server Free Fire sedang bermasalah"
          });
        }

        const player =
          data?.basicInfo ||
          data?.basicinfo ||
          data?.data?.basicInfo ||
          data?.data?.basicinfo;

        if (!player) {
          console.error("FF PLAYER DATA:", data);

          return res.status(404).json({
            success: false,
            message: "Player Free Fire tidak dijumpai"
          });
        }

        const nickname =
          player?.nickname ||
          player?.nickName ||
          player?.name ||
          player?.username;

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
            player?.accountId ||
            player?.accountid ||
            id
          ),
          server: String(
            player?.region ||
            region
          ),
          name: String(nickname),
          level: player?.level || null
        });

      } catch (error) {
        console.error("FF ERROR:", error);

        return res.status(502).json({
          success: false,
          message: "Server Free Fire tidak dapat dihubungi. Cuba lagi sebentar."
        });
      }
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
