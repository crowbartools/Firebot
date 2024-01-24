import Joi from 'joi';

export default Joi.object({
  APP_PORT: Joi.number().default(3001),
  // TWITCH_CLIENT_ID: Joi.string().required(),
});