
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

  const mailOptions = {
    from: 'noreply@ledgerise.org',
    to: body.donor,
    subject: 'Ledgerise, bağışınız alındı',
    html: `
    <div style="width:90%; padding: 5%; font-family: Arial, Helvetica, sans-serif;">
    <img style="width: 200px; margin-bottom: 20px;" src="https://ipfs.io/ipfs/QmSNodoSLei47aofXoCeKAEENHueqZ6i3ypPn9uHPsqJqD"></img>
    <div style="background-color: #f2f2f2; justify-content: center; width: 500px; padding: 36px 12px;">
      <div style="font-size: 24px; width: 100%; display: flex; justify-content: center; margin-bottom: 30px;">Merhaba ${body.donor}, bağışınız işleme alındı</div>
      <div style="background-color: #fff; padding: 24px; line-height: 36px;">Dünyada eşi benzeri olmayan, bağışınızı %100 şeffaf ve güvenilir bir şekilde takip edebileceğiniz Ledgerise'ı tercih ettiğiniz için teşekkür ederiz. Rapor sayfası üzerinden tüm güzergahı %100 şeffaflıkla takip edebilirsiniz.</div>
      <a style="margin-top: 20px; margin-left: 33.3333%; text-decoration: none; color: rgb(255, 255, 255); padding: 20px; width: 25%; display: flex; justify-content: center; align-items: center; background-color: #00909a;" target="_blank" href="https://ledgerise.onrender.com/assets?id=2&subcollectionId=1&nftAddress=0x155dEBfc7f38a10297EB35AC65f3839eA09c4d5F">Rapor sayfası</a>
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


module.exports = { sendDonationEmail }
