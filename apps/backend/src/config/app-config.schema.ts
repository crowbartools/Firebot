import Joi from 'joi';
import path from 'path';

export const appConfigSchema = Joi.object({
  WORKING_DIRECTORY_PATH: Joi.string().default(process.cwd()),
  USER_DATA_PATH: Joi.string().default(
    (config) => config.WORKING_DIRECTORY_PATH
  ),
  FIREBOT_DATA_PATH: Joi.string().default(
    (config) => path.join(config.USER_DATA_PATH, 'v6')
  ),
  TEMP_DATA_PATH: Joi.string().default(
    (config) => path.join(config.USER_DATA_PATH, 'temp')
  ),
});