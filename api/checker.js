module.exports = async (req, res) => {
  try {
    // =========================
    // METHOD CHECK
    // =========================

    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }


    // =========================
    // GET REQUEST DATA
    // =========================

    const {
      game,
      userId,
      zoneId,
      server
    } = req.body || {};


    // =========================
    // BASIC VALIDATION
    // =========================

    if (!game || !userId) {
      return res.status(400).json({
        success: false,
        message: "ID tidak lengkap."
      });
    }


    // =====================================================
    // MOBILE LEGENDS
    // =====================================================

    if (game === "mlbb") {

      if (!zoneId) {
        return res.status(400).json({
          success: false,
          message: "Zone ID diperlukan untuk MLBB."
        });
      }


      const apiUrl =
        "https://api.isan.eu.org/nickname/ml" +
        "?id=" +
        encodeURIComponent(userId) +
        "&server=" +
        encodeURIComponent(zoneId) +
        "&decode=false";


      const response = await fetch(apiUrl);


      // Baca sebagai text dahulu supaya API rosak
      // tidak menyebabkan JSON parse error
      const rawText = await response.text();


      let data;

      try {
        data = JSON.parse(rawText);
      } catch (error) {
        console.error(
          "MLBB API bukan JSON:",
          rawText.substring(0, 500)
        );

        return res.status(502).json({
          success: false,
          message: "API Mobile Legends sedang bermasalah."
        });
      }


      if (
        !response.ok ||
        data.success === false ||
        !data.name
      ) {
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



    // =====================================================
    // FREE FIRE
    // =====================================================

    if (game === "ff") {

      // Pastikan server hanya SG atau ID
      const selectedServer =
        String(server || "").toUpperCase();


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


      // Pastikan UID hanya nombor
      if (!/^\d+$/.test(String(userId))) {
        return res.status(400).json({
          success: false,
          message: "Player ID Free Fire mesti nombor."
        });
      }


      const apiUrl =
        "https://freefireinfo-zy9l.onrender.com/api/v1/player-profile" +
        "?uid=" +
        encodeURIComponent(userId) +
        "&server=" +
        encodeURIComponent(selectedServer);


      console.log(
        "Free Fire API request:",
        apiUrl
      );


      const response = await fetch(apiUrl);


      // Jangan terus response.json()
      // kerana API luar kadang-kadang pulangkan HTML/error text
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
          "Free Fire API bukan JSON:",
          rawText.substring(0, 500)
        );

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire sedang bermasalah. Cuba lagi."
        });
      }


      // API gagal
      if (!response.ok) {

        console.error(
          "Free Fire API error:",
          data
        );

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire tidak dapat dihubungi."
        });
      }


      // Ambil basicinfo
      const player = data.basicinfo;


      // Tiada player / nickname
      if (
        !player ||
        !player.nickname
      ) {

        return res.status(404).json({
          success: false,
          message:
            "ID Free Fire tidak dijumpai di server " +
            selectedServer +
            "."
        });
      }


      // Berjaya
      return res.status(200).json({
        success: true,
        game: "ff",
        id: player.accountid || userId,
        server: player.region || selectedServer,
        name: player.nickname,
        createAt: player.createat || null
      });
    }



    // =====================================================
    // GAME TIDAK DISOKONG
    // =====================================================

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
