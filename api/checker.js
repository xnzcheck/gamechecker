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

      const url =
        "https://www.freefireapi.me/info" +
        "?uid=" + encodeURIComponent(id);

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

      console.log("FF DATA:", data);

      if (!response.ok) {
        return res.status(404).json({
          success: false,
          message: "Player Free Fire tidak dijumpai"
        });
      }

      // Cuba beberapa kemungkinan format response
      const player =
        data?.basicInfo ||
        data?.basicinfo ||
        data?.playerInfo ||
        data?.player ||
        data?.data?.basicInfo ||
        data?.data?.basicinfo ||
        data?.data ||
        data;

      const nickname =
        player?.nickname ||
        player?.nickName ||
        player?.name ||
        data?.nickname ||
        data?.name;

      if (!nickname) {
        console.error(
          "FF NICKNAME TIADA:",
          data
        );

        return res.status(404).json({
          success: false,
          message: "Data Player Free Fire tidak dijumpai"
        });
      }

      const accountId =
        player?.accountId ||
        player?.accountid ||
        player?.uid ||
        data?.accountId ||
        data?.accountid ||
        id;

      const playerRegion =
        player?.region ||
        data?.region ||
        server;

      const level =
        player?.level ||
        data?.level ||
        null;

      return res.status(200).json({
        success: true,
        game: "ff",
        id: String(accountId),
        server: String(playerRegion),
        name: String(nickname),
        level: level
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
