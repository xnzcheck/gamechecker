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

    // ==========================================
    // MOBILE LEGENDS
    // ==========================================
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
        console.error("ML API ERROR:", error);

        return res.status(502).json({
          success: false,
          message: "API Mobile Legends tidak dapat dihubungi"
        });
      }
    }

    // ==========================================
    // FREE FIRE
    // ==========================================
    if (game === "ff" || game === "freefire") {

      // FF UID mesti nombor
      if (!/^[0-9]+$/.test(id)) {
        return res.status(400).json({
          success: false,
          message: "Player ID Free Fire mesti nombor sahaja"
        });
      }

      // Server yang kita sokong
      const region = server === "ID" ? "ID" : "SG";

      // ==========================================
      // 3 API FREE FIRE FALLBACK
      // ==========================================

      const apis = [

        // API 1
        {
          name: "FreeFireInfo",
          url:
            "https://freefireinfo-zy9l.onrender.com/api/v1/player-profile" +
            "?uid=" + encodeURIComponent(id) +
            "&server=" + encodeURIComponent(region)
        },

        // API 2
        {
          name: "DuyVinh",
          url:
            "https://ffdvinh09-info.vercel.app/player-info" +
            "?region=" + encodeURIComponent(region) +
            "&uid=" + encodeURIComponent(id)
        },

        // API 3
        {
          name: "FreeFFAPI",
          url:
            "https://free-ff-api-src-5plp.onrender.com/api/v1/account" +
            "?region=" + encodeURIComponent(region) +
            "&uid=" + encodeURIComponent(id)
        }
      ];

      let lastError = null;

      for (const api of apis) {

        try {
          console.log("Mencuba FF API:", api.name);

          const controller = new AbortController();

          const timeout = setTimeout(() => {
            controller.abort();
          }, 7000);

          const response = await fetch(api.url, {
            method: "GET",
            headers: {
              "Accept": "application/json"
            },
            signal: controller.signal
          });

          clearTimeout(timeout);

          const text = await response.text();

          let data;

          try {
            data = JSON.parse(text);
          } catch {
            console.log(
              api.name,
              "bukan JSON:",
              text.substring(0, 200)
            );

            lastError = "API bukan JSON";
            continue;
          }

          if (!response.ok) {
            console.log(
              api.name,
              "HTTP:",
              response.status,
              data
            );

            lastError = "HTTP " + response.status;
            continue;
          }

          // ------------------------------------------
          // Cari basicInfo daripada pelbagai format
          // ------------------------------------------

          const player =
            data?.basicInfo ||
            data?.basicinfo ||
            data?.data?.basicInfo ||
            data?.data?.basicinfo ||
            data?.player ||
            data?.data?.player;

          if (!player) {
            console.log(
              api.name,
              "basicInfo tidak ada"
            );

            lastError = "basicInfo tidak ada";
            continue;
          }

          // ------------------------------------------
          // Ambil nickname
          // ------------------------------------------

          const nickname =
            player?.nickname ||
            player?.nickName ||
            player?.name ||
            player?.username;

          if (!nickname) {
            console.log(
              api.name,
              "nickname tidak ada"
            );

            lastError = "nickname tidak ada";
            continue;
          }

          // ------------------------------------------
          // Ambil UID
          // ------------------------------------------

          const accountId =
            player?.accountId ||
            player?.accountid ||
            player?.uid ||
            id;

          // ------------------------------------------
          // Ambil region
          // ------------------------------------------

          const playerRegion =
            player?.region ||
            region;

          // ------------------------------------------
          // Berjaya
          // ------------------------------------------

          console.log(
            "FF BERJAYA:",
            api.name,
            accountId,
            nickname
          );

          return res.status(200).json({
            success: true,
            game: "ff",
            id: String(accountId),
            server: String(playerRegion),
            name: String(nickname),
            level: player?.level || null
          });

        } catch (error) {

          console.log(
            api.name,
            "ERROR:",
            error?.message || error
          );

          lastError = error?.message || "API error";
          continue;
        }
      }

      // ==========================================
      // SEMUA API GAGAL
      // ==========================================

      console.error(
        "SEMUA FF API GAGAL:",
        lastError
      );

      return res.status(502).json({
        success: false,
        message:
          "Server Free Fire sedang tidak dapat dihubungi. Cuba lagi sebentar."
      });
    }

    // ==========================================
    // GAME TAK DIKENALI
    // ==========================================

    return res.status(400).json({
      success: false,
      message: "Game tidak dikenali"
    });

  } catch (error) {

    console.error(
      "CHECKER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server checker mengalami masalah"
    });
  }
}
