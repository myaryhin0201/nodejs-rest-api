const sgMail = require('@sendgrid/mail')
const Mailgen = require('mailgen')
require('dotenv').config()

const createTemplate = (verifyToken, email) => {
  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'RestAPIYary',
      link: 'http://localhost:8000/'
    }
  })

  const template = {
    body: {
      name: email,
      intro:
        "Welcome to System Contacts! We're very excited to have you on board.",
      action: {
        instructions: 'To get started with System Contacts, please click here:',
        button: {
          color: '#22BC66',
          text: 'Confirm your account',
          link: `http://localhost:8000/users/verify/${verifyToken}`
        }
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help."
    }
  }

  const emailBody = mailGenerator.generate(template)
  return emailBody
}

const sendEmail = async (verifyToken, email) => {
  const emailBody = createTemplate(verifyToken, email)
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  const msg = {
    to: email,
    from: 'm.yaryhin@gmail.com',
    subject: 'Sending from RestApi',
    html: emailBody
  }
  await sgMail.send(msg)
}

module.exports = {
  sendEmail
}
