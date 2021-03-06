const functions = require('firebase-functions');
const twilio = require('twilio');
const URL = require('url');

const { MessagingResponse, VoiceResponse } = twilio.twiml;


module.exports = {

  /**
   * in production, the url we get in the express Request object
   * doesn't have the full pathname (it's missing the function name)
   * so we need to fix the url and pass it to validateExpressRequest
   */
  middleware: (req, res, next) => {
    if (!req.header('X-Twilio-Signature')) {
      return res.status(400).send('No signature header error');
    }

    let url = URL.format({
      protocol: req.protocol,
      host: req.hostname,
      pathname: req.originalUrl,
    });
    if (req.originalUrl.search(/\?/) >= 0) {
      url = url.replace(/%3F/g, '?');
    }
    if (!process.env.FUNCTIONS_EMULATOR) {
      url += process.env.FUNCTION_NAME;
    }

    const valid = twilio.validateExpressRequest(req, functions.config().twilio.auth_token, {
      url: url,
    });

    if (valid) {
      return next();
    } else {
      return res.status(403).send('Twilio Request Validation Failed');
    }
  },

  createEmptyMessageResponse: () => {
    const twiml = new MessagingResponse();
    return twiml.toString();
  },

  createEmptyVoiceResponse: () => {
    const twiml = new MessagingResponse();
    return twiml.toString();
  },

  createVoicemailRecordingPrompt: () => {
    const twiml = new VoiceResponse();
    twiml.play('https://firebasestorage.googleapis.com/v0/b/bedstuystrong-automation.appspot.com/o/voicemail_prompts%2Fkarla_english_spanish.mp3?alt=media&token=d62a8759-a81d-47a1-8290-0fad9f5db125');
    twiml.pause({ length: 1 });
    twiml.record({
      action: '/inbound-empty',  // do nothing so that the transcription can happen
      timeout: 10,
      transcribe: true,
      transcribeCallback: '/inbound-voicemail',
    });
    return twiml.toString();
  },

};