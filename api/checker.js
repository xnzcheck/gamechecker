module.exports = async (req, res) => {
  try {
    // =========================================
    // METHOD
    // =========================================

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }

    // =========================================
    // REQUEST DATA
    // =========================================

    const body = req.body || {};

    const game = String(body.game || "")
      .trim()
      .toLowerCase();

    const userId = String(body.userId || "").trim();

    const zoneId = String(body.zoneId || "").trim();

    const server = String(body.server || "")
      .trim()
      .toUpperCase();

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!game) {
      return res.status(400).json({
        success: false,
        message: "Game diperlukan."
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID tidak lengkap."
      });
    }

    // =========================================
    // MOBILE LEGENDS
    // =========================================

    if (game === "mlbb") {

      if (!zoneId) {
        return res.status(400).json({
          success: false,
          message: "Zone ID diperlukan untuk MLBB."
        });
      }

      // ID dan Zone mesti nombor
      if (!/^\d+$/.test(userId)) {
        return res.status(400).json({
          success: false,
          message: "ID MLBB mesti nombor."
        });
      }

      if (!/^\d+$/.test(zoneId)) {
        return res.status(400).json({
          success: false,
          message: "Zone ID MLBB mesti nombor."
        });
      }

      const apiUrl =
        "https://api.isan.eu.org/nickname/ml" +
        "?id=" +
        encodeURIComponent(userId) +
        "&server=" +
        encodeURIComponent(zoneId) +
        "&decode=false";

      console.log("MLBB request:", apiUrl);

      let response;

      try {
        response = await fetch(apiUrl);
      } catch (error) {
        console.error("MLBB fetch error:", error);

        return res.status(502).json({
          success: false,
          message: "API MLBB tidak dapat dihubungi."
        });
      }

      const rawText = await response.text();

      console.log(
        "MLBB API status:",
        response.status
      );

      let data;

      try {
        data = JSON.parse(rawText);
      } catch (error) {
        console.error(
          "MLBB bukan JSON:",
          rawText.substring(0, 500)
        );

        return res.status(502).json({
          success: false,
          message: "API MLBB sedang bermasalah."
        });
      }

      console.log("MLBB response:", data);

      // API memberitahu gagal
      if (
        !response.ok ||
        data.success === false
      ) {
        return res.status(404).json({
          success: false,
          message: "ID MLBB tidak dijumpai."
        });
      }

      // Cuba beberapa kemungkinan nama field
      const nickname =
        data.name ||
        data.nickname ||
        data.username;

      if (!nickname) {
        return res.status(404).json({
          success: false,
          message: "Nickname MLBB tidak dijumpai."
        });
      }

      return res.status(200).json({
        success: true,
        game: "mlbb",
        id: data.id || userId,
        server: data.server || data.zone || zoneId,
        name: nickname
      });
    }

    // =========================================
    // FREE FIRE
    // =========================================

    if (game === "ff") {

      // UID mesti nombor
      if (!/^\d+$/.test(userId)) {
        return res.status(400).json({
          success: false,
          message: "Player ID Free Fire mesti nombor."
        });
      }

      // Server default SG
      const selectedServer = server || "SG";

      // Hanya SG dan ID
      if (
        selectedServer !== "SG" &&
        selectedServer !== "ID"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Server Free Fire hanya Singapore (SG) atau Indonesia (ID)."
        });
      }

      const apiUrl =
        "https://freefireinfo-zy9l.onrender.com/api/v1/player-profile" +
        "?uid=" +
        encodeURIComponent(userId) +
        "&server=" +
        encodeURIComponent(selectedServer);

      console.log(
        "Free Fire request:",
        apiUrl
      );

      let response;

      try {
        response = await fetch(apiUrl);
      } catch (error) {
        console.error(
          "Free Fire fetch error:",
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
        "Free Fire API status:",
        response.status
      );

      let data;

      try {
        data = JSON.parse(rawText);
      } catch (error) {
        console.error(
          "Free Fire bukan JSON:",
          rawText.substring(0, 500)
        );

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire sedang bermasalah. Cuba lagi."
        });
      }

      console.log(
        "Free Fire response:",
        data
      );

      // =========================================
      // CHECK API ERROR
      // =========================================

      if (!response.ok) {

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire tidak dapat memproses permintaan."
        });
      }

      // =========================================
      // AMBIL PLAYER DATA
      // =========================================

      const player =
        data.basicinfo ||
        data.basicInfo ||
        data.player ||
        data.data?.basicinfo ||
        data.data?.basicInfo ||
        data.data;

      if (!player) {

        return res.status(404).json({
          success: false,
          message:
            "ID Free Fire tidak dijumpai di server " +
            selectedServer +
            "."
        });
      }

      // =========================================
      // AMBIL NICKNAME
      // =========================================

      const nickname =
        player.nickname ||
        player.nickName ||
        player.name;

      if (!nickname) {

        return res.status(404).json({
          success: false,
          message:
            "ID Free Fire tidak dijumpai di server " +
            selectedServer +
            "."
        });
      }

      // =========================================
      // SUCCESS
      // =========================================

      return res.status(200).json({
        success: true,
        game: "ff",
        id:
          player.accountid ||
          player.accountId ||
          userId,
        server:
          player.region ||
          player.Region ||
          selectedServer,
        name: nickname,
        level:
          player.level ||
          player.Level ||
          null,
        createAt:
          player.createat ||
          player.createAt ||
          null
      });
    }

    // =========================================
    // GAME NOT SUPPORTED
    // =========================================

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
        "Server API sedang bermasalah. Cuba lagi."
    });
  }
};
