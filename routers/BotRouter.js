
const express = require("express");
const router = express.Router();
const async = require("async");

const { SERVER_URL, PORT } = require("../utils/serverUrl");
const WhatsappVerifier = require("../models/WhatsappVerifier");
const Subcollection = require("../models/Subcollection");
const ActiveItem = require("../models/ActiveItem");
const VisualVerification = require("../models/VisualVerification");

const axios = require("axios");
const TokenUri = require("../models/tokenUri");

const keyMapping = {
  "/uretim": "stamp",
  "/depo": "shipped",
  "/teslim": "delivered",
};

const BASE_URL = `https://api.telegram.org/bot${process.env.LEDGERISE_LENS_BOT_API_KEY}`;

const processImage = (imageBase64, bounds) => {
  return new Promise((resolve, reject) => {
    // send request to python server
    const url = `${SERVER_URL}:${PORT}/real-time`;
    axios.post(url, {
      image: imageBase64,
      bounds: bounds
    })
      .then(res => {
        const data = res.data.trim();
        resolve(data);
      })
  });
}

const sendMessage = async (chatId, messageText) => {

  return axios.post(`${BASE_URL}/sendMessage`, {
    chat_id: chatId,
    text: messageText
  })
}

router.post("*", (req, res) => {
  const chatId = req.body.message.chat.id;
  const command = req.body.message.text;
  const caption = req.body.message.caption;

  if (command == "/start") {

    sendMessage(chatId, `Ledgerise'a hoşgeldiniz. Bağış kolilerinin üretim, depo ve teslim noktalarına ulaştığını doğrulayabilirsiniz. `)
      .then(responseObject => {
        return res.send({success: true})
      })
  } else if (command && command.includes("-[") && command.includes("]")) {
    const verifierId = req.body.message.from.id;

    WhatsappVerifier.findOne({ telegramId: verifierId }, (err, verifier) => {
      if (err || !verifier) {
        console.log("Hata oluştu.")
        return res.send({success: false})
      } else {
        verifier.qrCodeData = command;
        verifier.save();

        const tokenId = parseInt(command.split("-")[0]);

        ActiveItem.findOne({ nftAddress: verifier.nftAddress, tokenId: tokenId }, (err, activeItem) => {

          Subcollection.findOne({itemId: activeItem.subcollectionId, nftAddress: verifier.nftAddress}, (err, subcollection) => {

            TokenUri.findOne({ tokenUri: activeItem.tokenUri }, (err, tokenUri) => {
              sendMessage(chatId, `${subcollection.name} için ${tokenUri.name}'ni doğrulamak için lütfen resim yükleyin ve açıklamaya aşamayı yazın. \nÜretim için /uretim, depo için /depo, teslim için /teslim yazınız.`)
                .then(response5 => {
                  return res.json({ success: true })
                })
            })
          })
        })
      }
    })
  } 
  
  else if (caption == "/uretim" || caption == "/depo" || caption == "/teslim") {

    sendMessage(chatId, `Lütfen bekleyiniz...`)
      .then(response1 => {

        const verifierId = req.body.message.from.id;

        WhatsappVerifier.findOne({ telegramId: verifierId }, (err, verifier) => {
          if (err || !verifier) {
            console.log("Hata oluştu.")
            return res.send({success: false})
          } else {

            const photo = req.body.message.photo[1];

            const bounds = {
              x: (photo.width / 2),
              y: (photo.height / 2)
            };

            const getPathUrl = `${BASE_URL}/getFile?file_id=${photo.file_id}`;

            axios.get(getPathUrl)
              .then(response3 => {

                const filePath = response3.data.result.file_path;

                axios.get(`https://api.telegram.org/file/bot${process.env.LEDGERISE_LENS_BOT_API_KEY}/${filePath}`, {responseType: "arraybuffer"})
                  .then(async (response4) => {

                    const base64Data = Buffer.from(response4.data, 'binary').toString('base64');
                    
                    const processedImageData = await processImage(base64Data, bounds);
                    
                    if (JSON.parse(processedImageData)["found_status"] == "true") {

                      const subcollectionId = verifier.subcollectionId;
                      const nftAddress = verifier.nftAddress;
          
                      const tokenId = parseInt(verifier.qrCodeData.split("-")[0]);
                      const donorsArray = JSON.parse(verifier.qrCodeData.split("-")[1]);
                      
                      const key = keyMapping[caption];

                      async.timesSeries(donorsArray.length, async (i, next) => {

                        const openseaTokenId = parseInt(donorsArray[i]);
          
                        const item = await ActiveItem.findOne({ tokenId: tokenId, subcollectionId: subcollectionId, nftAddress: nftAddress }).select({ history: { $elemMatch: { openseaTokenId: openseaTokenId } } });

                        const routeObject = await ActiveItem.findOne({ tokenId: tokenId, subcollectionId: subcollectionId, nftAddress: nftAddress }).select("route");
                        
                        const buyer = item.history[0].buyer;
                        const route = routeObject.route;

                        let location = {};

                        if (key == "stamp") {
                          location = route.stampLocation;
                        }if (key == "shipped") {
                          location = route.shipLocation;
                        }if (key == "delivered") {
                          location = route.deliverLocation;
                        }
          
                        const eventData = {
                          nftAddress: nftAddress,
                          tokenId: tokenId,
                          openseaTokenId: openseaTokenId,
                          base64_image: base64Data,
                          buyer: buyer,
                          key: key,
                          location: {
                            latitude: parseInt(location.latitude) / (10 ** parseInt(location.decimals)),
                            longitude: parseInt(location.longitude) / (10 ** parseInt(location.decimals)),
                          },
                          date: Date.now().toString(),
                          isUploadedToBlockchain: false,
                          bounds: bounds,
                        }
          
                        VisualVerification.createVisualVerification(eventData, (err, visualVerification) => {
                          if (err == "incompatible_data") {return sendMessage(chatId, `Koli algılandı. Ancak veri uyumsuzluğu var. Lütfen tekrar deneyin.`)
                                      .then(response2 => {
                                        return;
                                      })}
                          if (err == "already_verified") {return sendMessage(chatId, `Koli algılandı. Ama bu koli çoktan doğrulanmış. Lütfen başka bir koli deneyin.`)
                          .then(response2 => {
                            return;
                          })}
  
                        })
                      }, (err) => {
                        sendMessage(chatId, `Koli algılandı. Doğrulama başarıyla tamamlandı. Teşekkür ederiz 🎉!`)
                        .then(response2 => {
                          return res.json({ success: true })
                        })
                      })
                    } else if (JSON.parse(processedImageData)["found_status"] == "false") {
                      sendMessage(chatId, `Koli algılanamadı. Lütfen yeni bir fotoğraf çekiniz.`)
                      .then(response2 => {
                        return res.json({ success: true })
                      })
                    } else {
                      sendMessage(chatId, `Koli algılanamadı. Lütfen yeni bir fotoğraf çekiniz.`)
                      .then(response2 => {
                        return res.json({ success: true })
                      })
                    }
                  })
              })
          }
        })
      })
  } else {
    sendMessage(chatId, `Bu mesajı anlayamadım. Kusura bakmayın.`)
      .then(responseObject => {
        return res.send({success: true})
      })
  }
});

module.exports = router;
