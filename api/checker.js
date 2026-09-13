module.exports = async (req, res) => {
  try {
    // =========================================
    // METHOD CHECK
    // =========================================

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }

    // =========================================
    // GET DATA
    // =========================================

    const {
      game,
      userId,
      zoneId,
      server
    } = req.body || {};

    const gameName = String(game || "")
      .trim()
      .toLowerCase();

    const id = String(userId || "").trim();

    const zone = String(zoneId || "").trim();

    const selectedServer = String(server || "SG")
      .trim()
      .toUpperCase();

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!gameName || !id) {
      return res.status(400).json({
        success: false,
        message: "ID tidak lengkap."
      });
    }

    // =========================================
    // MLBB
    // =========================================

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

      console.log("MLBB REQUEST:", apiUrl);

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

      console.log("MLBB RESPONSE:", data);

      if (
        !response.ok ||
        data.success === false
      ) {
        return res.status(404).json({
          success: false,
          message: "ID MLBB tidak dijumpai."
        });
      }

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
        id: data.id || id,
        server: data.server || zone,
        name: nickname
      });
    }

    // =========================================
    // FREE FIRE
    // =========================================

    if (gameName === "ff") {

      // UID mesti nombor
      if (!/^\d+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Player ID Free Fire mesti nombor."
        });
      }

      // Hanya SG atau ID
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

      // =====================================
      // API #1
      // =====================================

      const api1 =
        "https://freefireinfo-zy9l.onrender.com/api/v1/player-profile" +
        "?uid=" +
        encodeURIComponent(id) +
        "&server=" +
        encodeURIComponent(selectedServer);

      console.log("FREE FIRE API #1:", api1);

      let response1 = null;
      let data1 = null;

      try {

        response1 = await fetch(api1, {
          signal: AbortSignal.timeout(10000)
        });

        const text1 = await response1.text();

        console.log(
          "FREE FIRE API #1 STATUS:",
          response1.status
        );

        try {
          data1 = JSON.parse(text1);
        } catch (error) {
          console.error(
            "FREE FIRE API #1 INVALID JSON:",
            text1.substring(0, 300)
          );
        }

      } catch (error) {

        console.error(
          "FREE FIRE API #1 ERROR:",
          error.message
        );
      }

      // =====================================
      // CHECK API #1
      // =====================================

      if (data1) {

        const player1 =
          data1.basicinfo ||
          data1.basicInfo ||
          data1.data?.basicinfo ||
          data1.data?.basicInfo;

        if (
          player1 &&
          (
            player1.nickname ||
            player1.nickName ||
            player1.name
          )
        ) {

          const nickname =
            player1.nickname ||
            player1.nickName ||
            player1.name;

          return res.status(200).json({
            success: true,
            game: "ff",
            id:
              player1.accountid ||
              player1.accountId ||
              id,
            server:
              player1.region ||
              selectedServer,
            name: nickname,
            level:
              player1.level ||
              null,
            createAt:
              player1.createat ||
              player1.createAt ||
              null
          });
        }
      }

      // =====================================
      // API #2 FALLBACK
      // =====================================

      const api2 =
        "https://free-ff-api-src-5plp.onrender.com/api/v1/account" +
        "?region=" +
        encodeURIComponent(selectedServer) +
        "&uid=" +
        encodeURIComponent(id);

      console.log(
        "FREE FIRE API #2:",
        api2
      );

      let response2 = null;
      let data2 = null;

      try {

        response2 = await fetch(api2, {
          signal: AbortSignal.timeout(10000)
        });

        const text2 = await response2.text();

        console.log(
          "FREE FIRE API #2 STATUS:",
          response2.status
        );

        try {
          data2 = JSON.parse(text2);
        } catch (error) {
          console.error(
            "FREE FIRE API #2 INVALID JSON:",
            text2.substring(0, 300)
          );
        }

      } catch (error) {

        console.error(
          "FREE FIRE API #2 ERROR:",
          error.message
        );
      }

      // =====================================
      // CHECK API #2
      // =====================================

      if (data2) {

        const player2 =
          data2.basicInfo ||
          data2.basicinfo ||
          data2.data?.basicInfo ||
          data2.data?.basicinfo;

        if (
          player2 &&
          (
            player2.nickname ||
            player2.nickName ||
            player2.name
          )
        ) {

          const nickname =
            player2.nickname ||
            player2.nickName ||
            player2.name;

          return res.status(200).json({
            success: true,
            game: "ff",
            id:
              player2.accountId ||
              player2.accountid ||
              id,
            server:
              player2.region ||
              selectedServer,
            name: nickname,
            level:
              player2.level ||
              null,
            createAt:
              player2.createAt ||
              player2.createat ||
              null
          });
        }
      }

      // =====================================
      // BOTH API FAILED
      // =====================================

      console.error(
        "FREE FIRE BOTH API FAILED"
      );

      return res.status(502).json({
        success: false,
        message:
          "API Free Fire tidak dapat dihubungi sekarang. Cuba lagi sebentar."
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
        "Server checker sedang bermasalah."
    });
  }
};
