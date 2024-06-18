
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: 'smtp.elasticemail.com',
  port: 465,
  secure: true,
  auth: {
      user: 'noreply@ledgerise.org',
      pass: process.env.ELASTICEMAIL_SMTP_PASSWORD
  }
});


const sendDonationEmail = (body, callback) => {

  let donorName = "";
  if (body.donor.includes("@")) donorName = body.donor.split("@")[0];

  const mailOptions = {
    from: 'noreply@ledgerise.org',
    to: body.donor,
    subject: 'Ledgerise, bağışınız alındı',
    html: `
    <div style="width:90%; padding: 5%; font-family: Arial, Helvetica, sans-serif;">
    <img style="width: 200px; margin-bottom: 20px;" src="https://ipfs.io/ipfs/QmSNodoSLei47aofXoCeKAEENHueqZ6i3ypPn9uHPsqJqD"></img>
    <div style="background-color: #f2f2f2; justify-content: center; width: 500px; padding: 36px 12px;">
      <div style="font-size: 24px; width: 100%; display: flex; justify-content: center; margin-bottom: 30px;">Merhaba ${donorName},</div>
      <div style="background-color: #fff; padding: 24px; line-height: 36px;">${body.collectionName}'na yaptığınız bağışı %100 şeffaf ve güvenilir bir şekilde takip edebileceğiniz Ledgerise'ı tercih ettiğiniz için teşekkür ederiz. <a target="_blank" href="https://ledgerise.org/login">Giriş yapın</a> veya hesabınız yok ise bu maille <a target="_blank" href="https://ledgerise.org/register">hesap oluşturun</a> ve raporunuzu görüntüleyin.</div>
      <a style="margin-top: 20px; margin-left: 33.3333%; text-decoration: none; color: rgb(255, 255, 255); padding: 20px; width: 25%; display: block; text-align: center; background-color: #00909a;" target="_blank" href="https://ledgerise.org/assets?id=${body.tokenId}&subcollectionId=${body.subcollectionId}&nftAddress=${body.nftAddress}">Rapor sayfası</a>
    </div>
  </div>
  <div>End of message: ${Date.now()}</div>
  `
  };

  transporter.sendMail(mailOptions, function(error, info){
      if (error) {
          return callback(error);
      } else {
          return callback(null, true);
      }
  });
}

const sendVerificationEmail = (body, callback) => {
  let donorName = "";
  if (body.donor.includes("@")) donorName = body.donor.split("@")[0];

  let keyDescription = (body.key == "stamp" ? "üretildi" : body.key == "shipped" ? "depoya ulaştı" : body.key == "delivered" ? "ihtiyaç sahibine teslim edildi" : (""));

  const mailOptions = {
    from: 'noreply@ledgerise.org',
    to: body.donor,
    subject: `Ledgerise, bağışınız ${keyDescription}`,
    html: `
    <div style="width:90%; padding: 5%; font-family: Arial, Helvetica, sans-serif;">
    <img style="width: 200px; margin-bottom: 20px;" src="https://ipfs.io/ipfs/QmSNodoSLei47aofXoCeKAEENHueqZ6i3ypPn9uHPsqJqD"></img>
    <div style="background-color: #f2f2f2; justify-content: center; width: 500px; padding: 36px 12px;">
      <div style="font-size: 24px; width: 100%; display: flex; justify-content: center; margin-bottom: 30px;">Merhaba ${donorName},</div>
      <div style="background-color: #fff; padding: 24px; line-height: 36px;">Bağışladığınız <strong>${body.tokenName}</strong> ${keyDescription}. Rapor sayfasına ulaşarak bütün süreci %100 şeffaflıkla takip edebilirsiniz.</div>
      <a style="margin-top: 20px; margin-left: 33.3333%; text-decoration: none; color: rgb(255, 255, 255); padding: 20px; width: 25%; display: block; text-align: center; background-color: #00909a;" target="_blank" href="https://ledgerise.org/assets?id=${body.tokenId}&subcollectionId=${body.subcollectionId}&nftAddress=${body.nftAddress}">Rapor sayfası</a>
    </div>
  </div>
  <div>End of message: ${Date.now()}</div>
  `
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        return callback(error);
    } else {
        return callback(null, info);
    }
});
}


module.exports = { sendDonationEmail, sendVerificationEmail }
