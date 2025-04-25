const profiles = [
    {
        token: "ltoken_v2=; ltuid_v2=;;",   /** ใส่โทเคน และ ltuid หลัง =  */
        zzz: false,
        genshin: true,     /** อยากล็อคอินเกมอะไร ในทีนี้ผมเลือก genshin */
        honkai_star_rail: false,
        honkai_3: false,
        accountName: ""  /** ชื่อ account ไม่จำเป็นจ้องใส่ก็ได้ */
    }
];

/** Discord Notification **/
const discord_notify = true;
const myDiscordID = ""; /** ตอนแจ้งเตือนในดิส ให้แท็กเรา */
const discordWebhook =
    "https://discord.com/api/webhooks/";  /** webhookสคริป ช่องที่อยากให้ไปแจ้งเตือน */


/** The following is the script code. Please DO NOT modify. **/

const urlDict = {
    ZZZ:
        "https://sg-act-nap-api.hoyolab.com/event/luna/zzz/os/sign?lang=en-us&act_id=e202406031448091",
    Genshin:
        "https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=en-us&act_id=e202102251931481",
    Star_Rail:
        "https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202303301540311",
    Honkai_3:
        "https://sg-public-api.hoyolab.com/event/mani/sign?lang=en-us&act_id=e202110291205111"
};

async function main() {
    const messages = await Promise.all(profiles.map(autoSignFunction));
    const hoyolabResp = `${messages.join("\n\n")}`;

    if (discord_notify == true) {
        if (discordWebhook) {
            postWebhook(hoyolabResp);
        }
    }
}

function discordPing() {
    if (myDiscordID) {
        return `<@${myDiscordID}> `;
    } else {
        return "";
    }
}

function autoSignFunction({ token, zzz, genshin, honkai_star_rail, honkai_3, accountName }) {
    const urls = [];

    if (zzz) urls.push(urlDict.ZZZ);
    if (genshin) urls.push(urlDict.Genshin);
    if (honkai_star_rail) urls.push(urlDict.Star_Rail);
    if (honkai_3) urls.push(urlDict.Honkai_3);

    const header = {
        Cookie: token,
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "x-rpc-app_version": "2.34.1",
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "x-rpc-client_type": "4",
        Referer: "https://act.hoyolab.com/",
        Origin: "https://act.hoyolab.com"
    };

    const options = {
        method: "POST",
        headers: header,
        muteHttpExceptions: true
    };

    let response = `${accountName}`;
    let retry = false;

    do {
        const httpResponses = UrlFetchApp.fetchAll(urls.map(url => ({ url, ...options })));

        for (const [i, hoyolabResponse] of httpResponses.entries()) {
            const checkInResult = JSON.parse(hoyolabResponse).message;
            const gameName = Object.keys(urlDict)
                .find(key => urlDict[key] === urls[i])
                ?.replace(/_/g, " ");
            const isError = checkInResult != "OK";
            const bannedCheck = JSON.parse(hoyolabResponse).data?.gt_result?.is_risk;

            if (bannedCheck) {
                response += `\n${gameName}: ${discordPing()} Auto check-in failed due to CAPTCHA blocking.`;
                retry = true;
                break;
            } else {
                response += `\n${gameName}: ${isError ? discordPing() : ""}${checkInResult}`;
            }
        }

        // If any request failed due to CAPTCHA, retry in an hour
        if (retry) {
            Utilities.sleep(3600000); // Sleep for 1 hour (3600 seconds * 1000 milliseconds)
            retry = false;
        }
    } while (retry);

    return response;
}

function postWebhook(data) { 
    let payload = JSON.stringify({
        username: "ʀɪᴍᴜʀᴜ ɢɪᴠᴇꜱ ʏᴏᴜ ᴛʜᴇ ᴘʀɪᴍᴏɢᴇᴍ.",
        avatar_url: "https://cdn.discordapp.com/attachments/1276433865375879199/1277718573439127572/image.png?ex=66ce2fa6&is=66ccde26&hm=0e32ea05e2b673c64ae1bfc310bd5e045875a6d5798c768c18f877929922540a&",
        embeds: [
            {
                title: "Daily Check-In Genshin Impact Status",
                description: data,
                color: 7506394, // สีฟ้า
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Dev by nattapat2871"
                },
                thumbnail: {
                    url: "https://cdn.discordapp.com/emojis/740300330490921042.gif?size=128&quality=lossless" 
                },
                fields: [
                    {
                        name: "",
                        value: "**UID** :  ", /** ใส่ uid ของเรา */
                        inline: true 
                    },
                    {
                        name: "",
                        value: "\n\n[Click here to Contact me](https://discord.users/1007237437627572275)",
                        inline: false 
                    }
                ]
            }
        ]
    });

    const options = {
        method: "POST",
        contentType: "application/json",
        payload: payload,
        muteHttpExceptions: true
    };

    UrlFetchApp.fetch(discordWebhook, options);
}
