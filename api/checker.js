module.exports = async (req, res) => {
  try {
    // ==============================
    // METHOD
    // ==============================

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }

    // ==============================
    // DATA
    // ==============================

    const {
      game,
      userId,
      zoneId,
      server
    } = req.body || {};

    const gameName = String(game || "")
      .trim()
      .toLowerCase();

    const id = String(userId || "")
      .trim();

    const zone = String(zoneId || "")
      .trim();

    const selectedServer = String(server || "SG")
      .trim()
      .toUpperCase();

    // ==============================
    // BASIC CHECK
    // ==============================

    if (!gameName || !id) {
      return res.status(400).json({
        success: false,
        message: "ID tidak lengkap."
      });
    }

    // ==================================================
    // MOBILE LEGENDS
    // ==================================================

    if (gameName === "mlbb") {

      if (!zone) {
        return res.status(400).json({
          success: false,
          message: "Zone ID diperlukan untuk MLBB."
        });
      }

      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "ID MLBB mesti nombor."
        });
      }

      if (!/^\d+$/.test(zone)) {
        return res.status(400).json({
          success: false,
          message: "Zone ID MLBB mesti nombor."
        });
      }

      const apiUrl =
        "https://api.isan.eu.org/nickname/ml" +
        "?id=" +
        encodeURIComponent(id) +
        "&server=" +
        encodeURIComponent(zone) +
        "&decode=false";

      console.log("MLBB API:", apiUrl);

      let response;

      try {
        response = await fetch(apiUrl);
      } catch (error) {
        console.error("MLBB FETCH ERROR:", error);

        return res.status(502).json({
          success: false,
          message: "API MLBB tidak dapat dihubungi."
        });
      }

      const rawText = await response.text();

      let data;

      try {
        data = JSON.parse(rawText);
      } catch (error) {

        console.error(
          "MLBB INVALID JSON:",
          rawText.substring(0, 500)
        );

        return res.status(502).json({
          success: false,
          message: "API MLBB sedang bermasalah."
        });
      }

      const nickname =
        data.name ||
        data.nickname ||
        data.username;

      if (
        !response.ok ||
        data.success === false ||
        !nickname
      ) {
        return res.status(404).json({
          success: false,
          message: "ID MLBB tidak dijumpai."
        });
      }

      return res.status(200).json({
        success: true,
        game: "mlbb",
        id: data.id || id,
        server: data.server || zone,
        name: nickname
      });
    }

    // ==================================================
    // FREE FIRE
    // ==================================================

    if (gameName === "ff") {

      // UID mesti nombor
      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Player ID Free Fire mesti nombor."
        });
      }

      // Hanya SG / ID
      if (
        selectedServer !== "SG" &&
        selectedServer !== "ID"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Server Free Fire hanya SG atau ID."
        });
      }

      // ==============================
      // FREE FIRE API
      // ==============================

      const apiUrl =
        "https://ffdvinh09-info.vercel.app/player-info" +
        "?region=" +
        encodeURIComponent(selectedServer) +
        "&uid=" +
        encodeURIComponent(id);

      console.log(
        "FREE FIRE API:",
        apiUrl
      );

      let response;

      try {

        response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(15000)
        });

      } catch (error) {

        console.error(
          "FREE FIRE FETCH ERROR:",
          error
        );

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire tidak dapat dihubungi."
        });
      }

      const rawText = await response.text();

      console.log(
        "FREE FIRE STATUS:",
        response.status
      );

      let data;

      try {

        data = JSON.parse(rawText);

      } catch (error) {

        console.error(
          "FREE FIRE INVALID JSON:",
          rawText.substring(0, 500)
        );

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire mengembalikan data yang tidak sah."
        });
      }

      console.log(
        "FREE FIRE RESPONSE:",
        data
      );

      // ==============================
      // BASIC INFO
      // ==============================

      const player =
        data.basicInfo ||
        data.basicinfo ||
        data.data?.basicInfo ||
        data.data?.basicinfo;

      if (
        !response.ok ||
        !player
      ) {

        return res.status(404).json({
          success: false,
          message:
            "ID Free Fire tidak dijumpai di server " +
            selectedServer +
            "."
        });
      }

      // ==============================
      // NICKNAME
      // ==============================

      const nickname =
        player.nickname ||
        player.nickName ||
        player.name;

      if (!nickname) {

        return res.status(404).json({
          success: false,
          message:
            "Nickname Free Fire tidak dijumpai."
        });
      }

      // ==============================
      // BERJAYA
      // ==============================

      return res.status(200).json({
        success: true,
        game: "ff",
        id:
          player.accountId ||
          player.accountid ||
          id,
        server:
          player.region ||
          selectedServer,
        name: nickname,
        level:
          player.level ||
          null,
        createAt:
          player.createAt ||
          player.createat ||
          null
      });
    }

    // ==================================================
    // GAME TIDAK DISOKONG
    // ==================================================

    return res.status(400).json({
      success: false,
      message: "Game tidak disokong."
    });

  } catch (error) {

    console.error(
      "CHECKER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server checker sedang bermasalah."
    });
  }
};
