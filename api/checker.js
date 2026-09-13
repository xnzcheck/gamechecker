export default async function handler(req, res) {
  // ==============================
  // POST SAHAJA
  // ==============================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method tidak dibenarkan"
    });
  }

  try {
    const body = req.body || {};

    // ==============================
    // AMBIL DATA DARIPADA INDEX
    // ==============================

    const game = String(body.game || "")
      .toLowerCase()
      .trim();

    const id = String(
      body.id ||
      body.playerId ||
      body.userId ||
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


    // ==============================
    // CHECK ID
    // ==============================

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID tidak dimasukkan"
      });
    }


    // ==================================================
    // MOBILE LEGENDS
    // ==================================================

    if (
      game === "ml" ||
      game === "mlbb"
    ) {

      if (!zone) {
        return res.status(400).json({
          success: false,
          message: "Zone ID tidak dimasukkan"
        });
      }


      const mlUrl =
        "https://api.isan.eu.org/nickname/ml" +
        "?id=" +
        encodeURIComponent(id) +
        "&server=" +
        encodeURIComponent(zone) +
        "&decode=false";


      const controller =
        new AbortController();

      const timeout =
        setTimeout(() => {
          controller.abort();
        }, 15000);


      let response;

      try {

        response = await fetch(
          mlUrl,
          {
            method: "GET",
            headers: {
              "Accept": "application/json"
            },
            signal: controller.signal
          }
        );

      } catch (error) {

        clearTimeout(timeout);

        return res.status(502).json({
          success: false,
          message:
            "API Mobile Legends tidak dapat dihubungi."
        });

      }

      clearTimeout(timeout);


      const text =
        await response.text();


      let data;

      try {

        data = JSON.parse(text);

      } catch {

        return res.status(502).json({
          success: false,
          message:
            "API Mobile Legends mengembalikan data tidak sah."
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
          message:
            "ID Mobile Legends tidak dijumpai."
        });

      }


      return res.status(200).json({

        success: true,

        game: "ml",

        id: id,

        server: zone,

        name: nickname

      });

    }


    // ==================================================
    // FREE FIRE
    // ==================================================

    if (
      game === "ff" ||
      game === "freefire"
    ) {


      // Player ID mesti nombor
      if (!/^[0-9]+$/.test(id)) {

        return res.status(400).json({
          success: false,
          message:
            "Player ID Free Fire mesti nombor sahaja."
        });

      }


      // Hanya SG / ID
      const ffServer =
        server === "ID"
          ? "ID"
          : "SG";


      // API FREE FIRE
      const ffUrl =
        "https://freefireinfo-zy9l.onrender.com/api/v1/player-profile" +
        "?uid=" +
        encodeURIComponent(id) +
        "&server=" +
        encodeURIComponent(ffServer);


      const controller =
        new AbortController();


      const timeout =
        setTimeout(() => {
          controller.abort();
        }, 20000);


      let response;


      try {

        response = await fetch(
          ffUrl,
          {
            method: "GET",

            headers: {
              "Accept": "application/json"
            },

            signal: controller.signal
          }
        );

      } catch (error) {

        clearTimeout(timeout);

        console.error(
          "FREE FIRE FETCH ERROR:",
          error
        );

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire tidak dapat dihubungi. Cuba lagi."
        });

      }


      clearTimeout(timeout);


      const text =
        await response.text();


      let data;


      try {

        data = JSON.parse(text);

      } catch {

        console.error(
          "FREE FIRE INVALID RESPONSE:",
          text
        );

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire mengembalikan data tidak sah."
        });

      }


      if (!response.ok) {

        console.error(
          "FREE FIRE HTTP ERROR:",
          response.status,
          data
        );

        return res.status(502).json({
          success: false,
          message:
            "API Free Fire sedang bermasalah. Cuba lagi."
        });

      }


      // ==============================
      // AMBIL BASIC INFO
      // ==============================

      const player =
        data?.basicinfo ||
        data?.basicInfo ||
        data?.data?.basicinfo ||
        data?.data?.basicInfo;


      if (!player) {

        console.error(
          "FREE FIRE NO BASIC INFO:",
          data
        );

        return res.status(404).json({
          success: false,
          message:
            "Player Free Fire tidak dijumpai."
        });

      }


      // ==============================
      // NICKNAME
      // ==============================

      const nickname =
        player?.nickname ||
        player?.nickName ||
        player?.name;


      if (!nickname) {

        return res.status(404).json({
          success: false,
          message:
            "Nickname Free Fire tidak dijumpai."
        });

      }


      // ==============================
      // SUCCESS
      // ==============================

      return res.status(200).json({

        success: true,

        game: "ff",

        id:
          String(
            player?.accountid ||
            player?.accountId ||
            id
          ),

        server:
          String(
            player?.region ||
            ffServer
          ),

        name:
          String(nickname),

        level:
          player?.level || null

      });

    }


    // ==================================================
    // GAME TIDAK DIKENALI
    // ==================================================

    return res.status(400).json({
      success: false,
      message:
        "Game tidak dikenali."
    });


  } catch (error) {

    console.error(
      "CHECKER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server checker mengalami masalah. Cuba lagi."
    });

  }
}
